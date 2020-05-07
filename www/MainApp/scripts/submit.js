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

    function createNewDropzone(id, uuid, image_type, complete_callback) {
        var croppedBlobs = {};
        var maxFilesReached = false;
        var maxFiles = 1;

        if (image_type == "image") {
            maxFiles = 5;
        }

        return new Dropzone(id, {
            url: '/submit_images',
            autoProcessQueue: false,
            maxFiles: maxFiles,
            maxFilesize: 20,
            transformFile: function(file, done) {
                done(croppedBlobs[file.queueNumber]);
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

                this.on("queuecomplete", function(file, response) {
                    complete_callback();
                    this.options.autoProcessQueue = false;
                });

                this.on("success", function(file, response) {
                    console.log(response);
                    if (!response["success"]) {
                        console.log(response["error"]);
                        alert(response["error"]);
                        $('#fail_modal').modal('show');
                    }
                });

                this.on("error", function(file, error) {
                    console.log(error);
                    alert(error);
                    $('#fail_modal').modal('show');
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
                    confirm.style.left = '80px';
                    confirm.style.height = '40px';
                    confirm.style.fontSize = 'large';
                    confirm.style.top = '20px';
                    confirm.style.zIndex = 9999;
                    confirm.textContent = 'Confirm';
                    confirm.style.textAlign = "center";
                    confirm.style.lineHeight = "50%";
                    confirm.addEventListener('click', function() {

                        // Get the canvas with image data from Cropper.js
                        var canvas = myDropZone.cropper.getCroppedCanvas({
                            width: 2000,
                            height: 2000
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
                                    // croppedBlob = blob;
                                    var queueNumber = myDropZone.getQueuedFiles().length;
                                    file.queueNumber = queueNumber;
                                    // console.log(file);
                                    // console.log(myDropZone.getQueuedFiles().length)

                                    croppedBlobs[queueNumber] = blob;
                                    // done(blob);
                                }
                            );

                        });

                        // Remove the editor from view
                        editor.parentNode.removeChild(editor);

                    });
                    editor.appendChild(confirm);

                    // Create the rotation right button
                    var rotate_right = document.createElement('button');
                    rotate_right.style.position = 'absolute';
                    rotate_right.style.left = '20px';
                    rotate_right.style.top = '20px';
                    rotate_right.style.width = '40px';
                    rotate_right.style.height = '40px';
                    rotate_right.style.zIndex = 9999;
                    rotate_right.style.textAlign = "center";
                    rotate_right.style.lineHeight = "50%";

                    var icon = document.createElement('i')
                    icon.setAttribute("class", "fa fa-rotate-right")
                    icon.style.fontColor = "#555";
                    icon.style.fontSize = "20px";
                    rotate_right.append(icon);

                    rotate_right.addEventListener('click', function() {
                        myDropZone.cropper.rotate(90);
                    });
                    editor.appendChild(rotate_right);


                    // Load the image
                    var image = new Image();
                    image.src = URL.createObjectURL(file);
                    editor.appendChild(image);

                    // Append the editor to the page
                    document.body.appendChild(editor);

                    // Create Cropper.js and pass image
                    myDropZone.cropper = new window.Cropper(image, {
                        aspectRatio: 1,
                        rotatable: true,
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
                                self.imageDropzone.options.autoProcessQueue = true;
                                self.imageDropzone.processQueue();
                            }
                            else {
                                console.log(response["error"]);
                                alert(response["error"]);
                                $('#fail_modal').modal('show');
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
                console.log("Text queue DONE!");
                $.ajax({
                    type: "POST",
                    url: "/complete_submission",
                    ContentType: 'application/json',
                    data: {'uuid':self.uuid}, // serializes the form's elements.
                    success: function(data) {
                       console.log(data["success"]); // show response from the php script.
                        if (data["success"]) {
                            $('#success_modal').modal('show');
                        }
                        else {
                            console.log(data["error"]);
                            alert(data["error"]);
                            $('#fail_modal').modal('show');
                        }
                    }
                });
            });
            this.imageDropzone = createNewDropzone("#imageDropzone", this.uuid, "image", function() {
                console.log("Image queue DONE!");
                self.textDropzone.processQueue();
            });
            // window.Dropzone.options.textDropzone = createNewDropzone()

            $('#success_modal').on('shown.bs.modal', function () {
                $('#new_submission_btn').trigger('focus')
            })

            $('#success_modal').on('hide.bs.modal', function () {
                window.location.reload(true);
            })

            $('#fail_modal').on('shown.bs.modal', function () {
                $('#refresh_btn').trigger('focus')
            })

            $('#fail_modal').on('hide.bs.modal', function () {
                window.location.reload(true);
            })

        }
    });
});
