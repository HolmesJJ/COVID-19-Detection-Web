(function ($) {
    "use strict";

    /*==================================================================
    [ Focus input ]*/
    $('.input100').each(function () {
        $(this).on('blur', function () {
            if ($(this).val().trim() != "") {
                $(this).addClass('has-val');
            } else {
                $(this).removeClass('has-val');
            }
        })
    })

    /*==================================================================
    [ Validate ]*/
    const input = $('.validate-input .input100');

    $('.validate-form').on('submit', function (e) {

        e.preventDefault();

        let check = true;
        for (let i = 0; i < input.length; i++) {
            if (validate(input[i]) === false) {
                showValidate(input[i]);
                check = false;
            }
        }
        if (check) {
            const username = $(input[0]).val();
            const password = $(input[1]).val();
            submit(username, password);
        }

        return true;
    });


    $('.validate-form .input100').each(function () {
        $(this).focus(function () {
            hideValidate(this);
        });
    });

    function validate(input) {
        if ($(input).attr('type') === 'email' || $(input).attr('name') === 'email') {
            if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) === null) {
                return false;
            }
        } else {
            if ($(input).val().trim() === '') {
                return false;
            }
        }
    }

    function showValidate(input) {
        const thisAlert = $(input).parent();
        $(thisAlert).addClass('alert-validate');
    }

    function hideValidate(input) {
        const thisAlert = $(input).parent();
        $(thisAlert).removeClass('alert-validate');
    }

    function submit(username, password) {

        $('.login100-form-message').text('');
        const loader = $('.container-loader');
        loader.show();

        const data = {
            username: username,
            password: password,
        }

        const request = $.ajax({
            url: 'http://localhost:8000/login',
            type: 'post',
            dataType: 'json',
            data: JSON.stringify(data),
        });

        // Callback handler that will be called on success
        request.done(function (response, textStatus, jqXHR) {
            // Log a message to the console
            loader.hide();
            const result = JSON.parse(JSON.stringify(response));
            if (result.code === 0) {
                $('.container-face-recognition').show();
                startFaceRecognition();
            } else {
                $('.login100-form-message').text('Username or password is not correct.');
            }
        });

        // Callback handler that will be called on failure
        request.fail(function (jqXHR, textStatus, errorThrown) {
            // Log the error to the console
            console.error(
                'The following error occurred: ' +
                textStatus, errorThrown
            );
            loader.hide();
            $('.login100-form-message').text('Server error.');
        });

        // Callback handler that will be called regardless
        // if the request failed or succeeded
        request.always(function () {

        });
    }

    /*==================================================================
    [ Face Recognition]*/
    let recognizing = false;
    let stream;
    let forwardTimes = [];

    const webcam = document.querySelector(".container-webcam .webcam");
    const canvas = document.querySelector(".container-canvas .canvas");
    const screenshot = document.querySelector(".face-recognition .screenshot");

    webcam.addEventListener('play', onPlay);
    webcam.addEventListener('loadedmetadata', initCanvas);

    function initCanvas() {
        canvas.offsetwidth = webcam.videoWidth;
        canvas.offsetheight = webcam.videoHeight;
        canvas.width = webcam.videoWidth;
        canvas.height = webcam.videoHeight;
        screenshot.width = webcam.videoWidth;
        screenshot.height = webcam.videoHeight;
    }

    function updateTimeStats(timeInMs) {
        forwardTimes = [timeInMs].concat(forwardTimes).slice(0, 30);
        const avgTimeInMs = forwardTimes.reduce((total, t) => total + t) / forwardTimes.length;
        $('#time').val(`${Math.round(avgTimeInMs)} ms`)
        $('#fps').val(`${faceapi.utils.round(1000 / avgTimeInMs)}`);
    }

    function takeScreenshot() {
        /* make the snapshot */
        screenshot.getContext('2d').drawImage(webcam, 0, 0, screenshot.width, screenshot.height);
        return screenshot.toDataURL("image/png");
    }


    function dataURItoBlob(dataURI) {

        var blobBin = atob(dataURI.split(',')[1]);
        var array = [];
        for (var i = 0; i < blobBin.length; i++) {
            array.push(blobBin.charCodeAt(i));
        }
        return new Blob([new Uint8Array(array)], {
            type: 'image/png'
        });
    }

    async function startFaceRecognition() {
        // load the models
        if (!isFaceDetectionModelLoaded()) {
            await getCurrentFaceDetectionNet().load('../weights');
        }

        // try to access users webcam and stream the images
        // to the video element
        stream = await navigator.mediaDevices.getUserMedia({
            video: {}
        });
        webcam.srcObject = stream;
    }

    async function stopFaceRecognition() {
        if (stream !== undefined) {
            stream.getTracks().forEach(function (track) {
                track.stop();
            });
        }
        stream = undefined;
        webcam.srcObject = undefined;
    }

    async function onPlay() {
        if (webcam.paused || webcam.ended || !isFaceDetectionModelLoaded())
            return setTimeout(() => onPlay());

        const options = getFaceDetectorOptions();
        const ts = Date.now();
        const result = await faceapi.detectSingleFace(webcam, options);

        updateTimeStats(Date.now() - ts)

        if (result) {
            const dims = faceapi.matchDimensions(canvas, webcam, true);
            faceapi.draw.drawDetections(canvas, faceapi.resizeResults(result, dims));
            if (!recognizing) {
                recognizing = true;
                const username = $('.validate-form [name=username]').val();
                const face = dataURItoBlob(takeScreenshot());
                recognize(username, face);
                $('.face-recognition .message').text('Recognizing...');
            }
        } else {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (!recognizing) {
                $('.face-recognition .message').text('Please show your face.');
            }
        }

        setTimeout(() => onPlay());
    }

    function recognize(username, face) {

        const xhr = new XMLHttpRequest();

        if (xhr.upload) {
            // File received / failed
            xhr.onreadystatechange = function (e) {
                if (xhr.readyState == XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        console.log(xhr.responseText);
                        const result = JSON.parse(xhr.responseText);
                        if (result.code === 0) {
                            setCookie("username", username, 1);
                            if ($('.container-radio [name="radio"]:checked').val() === 'detect') {
                                window.location.href = "detect.html";
                            } else {
                                window.location.href = "label.html";
                            }
                        }
                    }
                    recognizing = false;
                    $('.face-recognition .message').text('');
                }
            };

            const data = new FormData();
            data.append("recognize", face, username + '.png');

            // Start upload
            xhr.open('POST', 'http://localhost:8000/recognize', true);
            xhr.send(data);
        }
    }

    /*==================================================================
    [ Close ]*/
    $('.container-face-recognition .face-recognition .close').on('click', function (e) {
        e.preventDefault();
        $('.face-recognition .message').text('');
        stopFaceRecognition();
        $('.container-face-recognition').hide();
    });
})(jQuery);