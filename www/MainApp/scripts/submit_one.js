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

    function createNewDropzone(id, uuid, image_num, complete_callback) {
        var croppedBlobs = {};
        var maxFilesReached = false;
        var maxFiles = 1;

        return new Dropzone(id, {
            url: '/submit_images/',
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
                image_num: image_num,
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
                    confirm.style.left = '260px';
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
                            height: 2000,
                            fillColor:'#ffffff',
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

                        }, 'image/jpeg');

                        // Remove the editor from view
                        editor.parentNode.removeChild(editor);

                    });
                    editor.appendChild(confirm);

                    function createRotateButton(rotation_degrees, rotation_direction, left) {
                        // Create the rotation right button
                        var rotate_right = document.createElement('button');
                        rotate_right.style.position = 'absolute';
                        rotate_right.style.left = left + 'px';
                        rotate_right.style.top = '20px';
                        // rotate_right.style.width = '40px';
                        rotate_right.style.height = '40px';
                        rotate_right.style.zIndex = 9999;
                        rotate_right.style.textAlign = "center";
                        rotate_right.style.lineHeight = "50%";
                        rotate_right.style.paddingLeft = "5px";
                        rotate_right.style.paddingRight = "5px";

                        var icon = document.createElement('i')
                        if (rotation_direction == "right") {
                            icon.setAttribute("class", "fa fa-rotate-right")
                        }
                        else {
                            icon.setAttribute("class", "fa fa-rotate-left")
                        }
                        icon.style.fontColor = "#555";
                        icon.style.fontSize = "20px";
                        rotate_right.append(icon);

                        var span = document.createElement('span')
                        span.textContent = rotation_degrees + "°";
                        span.style.fontSize = "20px";
                        span.style.marginLeft = "5px";
                        rotate_right.style.marginLeft = "5px";
                        rotate_right.append(span);

                        if (rotation_direction != "right") {
                            rotation_degrees = -rotation_degrees;
                        }

                        rotate_right.addEventListener('click', function() {
                            myDropZone.cropper.rotate(rotation_degrees);
                        });

                        return rotate_right;
                    }
                    editor.appendChild(createRotateButton(90, "right", 20));
                    editor.appendChild(createRotateButton(5, "right", 100));
                    editor.appendChild(createRotateButton(5, "left", 165));

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
                image1Dropzone: null,
                // image2Dropzone: null,
                uuid: Math.uuid(),

                ms_props: { // multistep form properties
                    current_fs: null, next_fs: null, previous_fs: null, //fieldsets
                    left: null, opacity: null, scale: null, //fieldset properties which we will animate
                    animating: null, //flag to prevent quick multi-click glitches
                }
            };
        },
        methods: {
            validateConsent: function(event) {
                var consentGiven = $("#id_consent_checkbox").prop("checked");
                if (!consentGiven) {
                    animateCSS("#div_id_consent_checkbox", "pulse");
                }
                else {
                    this.next(event);
                }
            },
            validateFearDescription: function(event) {
                var fearTextPresent = ($("#id_fear_text").val().trim()).length > 0
                var fearColorsTextPresent = ($("#id_fear_colors_text").val().trim()).length > 0
                if (!fearTextPresent) {
                    animateCSS("#id_fear_text", "pulse");
                }
                else {
                    if (!fearColorsTextPresent) {
                        animateCSS("#id_fear_colors_text", "pulse");
                    }
                    else {

                        // Submit consent form


                        this.next(event);
                    }
                }
            },
            previous: function(event) {
                var self = this;
                var ms_props = self.ms_props;

                if(ms_props.animating) return false;
                ms_props.animating = true;

                ms_props.current_fs = $(event.target).parent();
                ms_props.previous_fs = $(event.target).parent().prev();

                //de-activate current step on progressbar
                $("#progressbar li").eq($("fieldset").index(ms_props.current_fs)).removeClass("active");

                //show the previous fieldset
                ms_props.previous_fs.show();
                //hide the current fieldset with style
                ms_props.current_fs.animate({"opacity": 0}, {
                    step: function(now, mx) {
                        //as the opacity of current_fs reduces to 0 - stored in "now"
                        //1. scale previous_fs from 80% to 100%
                        ms_props.scale = 0.8 + (1 - now) * 0.2;
                        //2. take current_fs to the right(50%) - from 0%
                        ms_props.left = ((1-now) * 50)+"%";
                        //3. increase opacity of previous_fs to 1 as it moves in
                        ms_props.opacity = 1 - now;
                        ms_props.current_fs.css({'left': ms_props.left});
                        ms_props.previous_fs.css({'transform': 'scale('+ms_props.scale+')', 'opacity': ms_props.opacity});
                    },
                    duration: 800,
                    complete: function(){
                        ms_props.current_fs.hide();
                        ms_props.animating = false;
                    },
                    //this comes from the custom easing plugin
                    easing: 'easeInOutBack'
                });
            },
            next: function(event) {
                var self = this;
                var ms_props = self.ms_props;

                if(ms_props.animating) return false;
                ms_props.animating = true;

                ms_props.current_fs = $(event.target).parent();
                ms_props.next_fs = $(event.target).parent().next();

                //activate next step on progressbar using the index of ms_props.next_fs
                $("#progressbar li").eq($("fieldset").index(ms_props.next_fs)).addClass("active");

                //show the next fieldset
                ms_props.next_fs.show();
                //hide the current fieldset with style
                ms_props.current_fs.animate({"opacity": 0}, {
                    step: function(now, mx) {
                        //as the opacity of current_fs reduces to 0 - stored in "now"
                        //1. scale current_fs down to 80%
                        ms_props.scale = 1 - (1 - now) * 0.2;
                        //2. bring next_fs from the right(50%)
                        ms_props.left = (now * 50)+"%";
                        //3. increase opacity of next_fs to 1 as it moves in
                        ms_props.opacity = 1 - now;
                        ms_props.current_fs.css({
                    'transform': 'scale('+ms_props.scale+')',
                    'position': 'absolute'
                  });
                        ms_props.next_fs.css({'left': ms_props.left, 'opacity': ms_props.opacity});
                    },
                    duration: 800,
                    complete: function(){
                        ms_props.current_fs.hide();
                        ms_props.animating = false;
                    },
                    //this comes from the custom easing plugin
                    easing: 'easeInOutBack'
                });
            },
            // submitForm: function(event) {
            submitForm: function(event) {

                var self = this;
                event.preventDefault();

                var image1Present = $('#image1Dropzone').get(0).dropzone.getAcceptedFiles().length >= 1;
                var image2Present = true;
                var bothPresent = image1Present && image2Present;

                var consentGiven = $("#id_consent_checkbox").prop("checked");
                // if (!consentGiven) {
                //     animateCSS("#div_id_consent_checkbox", "pulse");
                // }
                if (!bothPresent) {
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
                                self.image1Dropzone.options.autoProcessQueue = true;
                                self.image1Dropzone.processQueue();
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
            // this.image2Dropzone = createNewDropzone("#image2Dropzone", this.uuid, 2, function() {
            //     console.log("Image 2 queue DONE!");
            // });
            this.image1Dropzone = createNewDropzone("#image1Dropzone", this.uuid, 1, function() {
                console.log("Image 1 queue DONE!");
                $.ajax({
                    type: "POST",
                    url: "/complete_submission/",
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
                // self.image2Dropzone.processQueue();
            });
            // window.Dropzone.options.image2Dropzone = createNewDropzone()

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
