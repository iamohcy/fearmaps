$(function() {

    function animateCSS(element, animationName, callback) {
        const node = document.querySelector(element)
        node.classList.add('animated', animationName)

        function handleAnimationEnd() {
            node.classList.remove('animated', animationName)
            node.removeEventListener('animationend', handleAnimationEnd)

            if (typeof callback === 'function') callback()
        }

        node.addEventListener('animationend', handleAnimationEnd)
    }

    // using jQuery
    function getCookie(name) {
        var cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    var csrftoken = getCookie('csrftoken');

    function csrfSafeMethod(method) {
        // these HTTP methods do not require CSRF protection
        return (/^(GET|HEAD|OPTIONS|TRACE)$/.test(method));
    }


    $.ajaxSetup({
        beforeSend: function(xhr, settings) {
            if (!csrfSafeMethod(settings.type) && !this.crossDomain) {
                xhr.setRequestHeader("X-CSRFToken", csrftoken);
            }
        }
    });

    window.imageBlob = null;
    window.textBlob = null;

    function createNewDropzone(id, uuid, image_type, success_callback) {
        var croppedBlob = null;
        var maxFilesReached = false;

        return new Dropzone(id, {
            url: '/submit_images',
            autoProcessQueue: false,
            maxFiles: 1,
            transformFile: function(file, done) {
                done(croppedBlob);
            },
            headers:{
                'X-CSRFToken' : csrftoken,
            },
            params: {
                uuid: uuid,
                image_type: image_type,
            },

            // accept: function(file, done) {
            //     if (maxFilesReached) {
            //         done("You should only upload a single file!");
            //     }
            //     else { done(); }
            // },
            init: function() {
                this.on("maxfilesreached", function(file, response) {
                    maxFilesReached = true;
                });

                this.on("success", function(file, response) {
                    console.log(response);
                    success_callback();
                });

                this.on("error", function(file, error) {
                    console.log(error);
                    alert("Image was not sent succesfully! Please refresh the page and try again");
                })

                this.on("addedfile", function(file) {

                    if (maxFilesReached) {
                       this.removeFile(this.files[0]);
                    }

                    var myDropZone = this;

                    // Create the image editor overlay
                    var editor = document.createElement('div');
                    editor.style.position = 'fixed';
                    editor.style.left = 0;
                    editor.style.right = 0;
                    editor.style.top = 0;
                    editor.style.bottom = 0;
                    editor.style.zIndex = 9999;
                    editor.style.backgroundColor = '#000';

                    // Create the confirm button
                    var confirm = document.createElement('button');
                    confirm.style.position = 'absolute';
                    confirm.style.left = '10px';
                    confirm.style.top = '10px';
                    confirm.style.zIndex = 9999;
                    confirm.textContent = 'Confirm';
                    confirm.addEventListener('click', function() {

                        // Get the canvas with image data from Cropper.js
                        var canvas = cropper.getCroppedCanvas({
                            width: 1000,
                            height: 1000
                        });

                        // Turn the canvas into a Blob (file object without a name)
                        canvas.toBlob(function(blob) {

                            // Update the image thumbnail with the new image data
                            myDropZone.createThumbnail(
                                blob,
                                myDropZone.options.thumbnailWidth,
                                myDropZone.options.thumbnailHeight,
                                myDropZone.options.thumbnailMethod,
                                false,
                                function(dataURL) {
                                    // Update the Dropzone file thumbnail
                                    myDropZone.emit('thumbnail', file, dataURL);

                                    // Return modified file to dropzone
                                    croppedBlob = blob;
                                    // done(blob);
                                }
                            );

                        });

                        // Remove the editor from view
                        editor.parentNode.removeChild(editor);

                    });
                    editor.appendChild(confirm);

                    // Load the image
                    var image = new Image();
                    image.src = URL.createObjectURL(file);
                    editor.appendChild(image);

                    // Append the editor to the page
                    document.body.appendChild(editor);

                    // Create Cropper.js and pass image
                    var cropper = new window.Cropper(image, {
                        aspectRatio: 1
                    });
                });
            }
        });
    }

    var submissionForm = new Vue({
        delimiters: ['[[', ']]'],
        el: '#main',
        maxFiles: 1,
        addRemoveLinks: true,
        data () {
            return {
                imageDropzone: null,
                textDropzone: null,
                uuid: Math.uuid(),
            };
        },
        methods: {
            // submitForm: function(event) {
            submitForm: function(event) {

                var self = this;
                event.preventDefault();

                var numImageFiles = $('#imageDropzone').get(0).dropzone.getAcceptedFiles().length;
                var numTextFiles = $('#textDropzone').get(0).dropzone.getAcceptedFiles().length;

                var consentGiven = $("#id_consent_checkbox").prop("checked");
                if (!consentGiven) {
                    animateCSS("#div_id_consent_checkbox", "pulse");
                }
                else if ((numImageFiles < 1) || (numTextFiles < 1)) {
                    animateCSS("#upload-instructions-div", "pulse");
                }
                else {
                    var form = $("#consent-form");

                    console.log(self.uuid);
                    $("#id_uuid").val(self.uuid);

                    var url = form.attr('action');

                    $.ajax({
                        type: "POST",
                        url: url,
                        data: form.serialize(), // serializes the form's elements.
                        success: function(data) {
                           console.log(data["success"]); // show response from the php script.
                            if (data["success"]) {
                                self.imageDropzone.processQueue();

                            }
                            else {
                                alert("Your response was not uploaded due to a technical error. Please, try again later");
                            }
                        }
                    });
                }

            }
        },

        mounted() {
            Dropzone.autoDiscover = false;
            var self = this;
            this.textDropzone = createNewDropzone("#textDropzone", this.uuid, "text", function() {
                console.log("ALL DONE!");
                alert("Submission successful!");
                window.location.reload(true);
            });
            this.imageDropzone = createNewDropzone("#imageDropzone", this.uuid, "image", function() {self.textDropzone.processQueue();});
            // window.Dropzone.options.textDropzone = createNewDropzone()
        }
    });
});
