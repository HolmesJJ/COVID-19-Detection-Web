(function ($) {
    "use strict";

        if (!checkCookie()) {
            window.location.href = "index.html";
        }

    const radiography = $('.container-radiography .radiography');
    const containerCanvas = $('.container-canvas');
    const canvas = document.querySelector(".container-canvas .canvas");
    const slider = $('.container-result .container-slide .slider');
    const slideValue = $('.container-result .container-slide .slide-value');
    slideValue.text(slider.val() + '%');

    const ctx = canvas.getContext("2d");

    const boxes256 = new Array();
    const labels = new Array();
    const scores = new Array();
    const labelTexts = ['negative', 'typical', 'indeterminate', 'atypical'];
    const originalImageSize = new Array(0, 0);

    // Check for the various File API support.
    if (window.File && window.FileList && window.FileReader) {
        Init();
    } else {
        document.getElementById('file-drag').style.display = 'none';
    }

    function Init() {

        console.log("Upload Initialised");

        const fileSelect = document.getElementById('file-upload');
        const fileDrag = document.getElementById('file-drag');
        const submitButton = document.getElementById('submit-button');

        fileSelect.addEventListener('change', fileSelectHandler, false);

        // Is XHR2 available?
        var xhr = new XMLHttpRequest();
        if (xhr.upload) {
            // File Drop
            fileDrag.addEventListener('dragover', fileDragHover, false);
            fileDrag.addEventListener('dragleave', fileDragHover, false);
            fileDrag.addEventListener('drop', fileSelectHandler, false);
        }
    }

    function fileDragHover(e) {
        const fileDrag = document.getElementById('file-drag');

        e.stopPropagation();
        e.preventDefault();

        fileDrag.className = (e.type === 'dragover' ? 'hover' : 'modal-body file-upload');
    }

    function fileSelectHandler(e) {
        // Fetch FileList object
        const files = e.target.files || e.dataTransfer.files;

        // Cancel event and hover styling
        fileDragHover(e);

        // Process all File objects
        for (let i = 0, f; f = files[i]; i++) {
            parseFile(f);
            uploadFile(f);
        }
    }

    // Output
    function output(msg) {
        // Response
        const message = document.getElementById('message');
        message.innerHTML = msg;
    }

    function uploadFile(file) {

        const xhr = new XMLHttpRequest();
        const fileInput = document.getElementById('class-roster-file');
        const pBar = document.getElementById('file-progress');
        const fileSizeLimit = 50; // In MB

        if (xhr.upload) {
            // Check if file is less than x MB
            if (file.size <= fileSizeLimit * 1024 * 1024) {
                // Progress bar
                pBar.style.display = 'inline';
                xhr.upload.addEventListener('loadstart', setProgressMaxValue, false);
                xhr.upload.addEventListener('progress', updateFileProgress, false);

                // File received / failed
                xhr.onreadystatechange = function (e) {
                    if (xhr.readyState == XMLHttpRequest.DONE) {
                        if (xhr.status === 200) {
                            const result = JSON.parse(xhr.responseText);
                            console.log(result);
                            if (result.code == 0) {
                                showResut(true, 'http://localhost:8000/show/' + result.id + '.png', message);
                                console.log('boxes_256: ' + result.boxes_256.length + ', labels: ' + result.labels.length + ', scores: ' + result.scores.length);
                                for (let i = 0; i < result.boxes_256.length; i++) {
                                    boxes256.push(result.boxes_256[i]);
                                    labels.push(result.labels[i]);
                                    scores.push(result.scores[i]);
                                }
                            } else {
                                popup(true, 'Detect failed. Please upload again.');
                                document.location.reload(true);
                            }
                        } else {
                            popup(true, 'Detect failed. Please upload again.');
                            document.location.reload(true);
                        }
                    }
                };

                const data = new FormData();
                data.append('detect', file);

                // Start upload
                xhr.open('POST', 'http://localhost:8000/detect', true);
                xhr.send(data);
            } else {
                output('Please upload a smaller file (< ' + fileSizeLimit + ' MB).');
            }
        }
    }

    function parseFile(file) {

        output(
            '<strong>' + encodeURI(file.name) + '</strong>'
        );

        var fileName = file.name;

        var isGood = (/\.(?=dcm)/gi).test(fileName);
        if (isGood) {
            document.getElementById('start').classList.add("hidden");
            document.getElementById('response').classList.remove("hidden");
            document.getElementById('notdicom').classList.add("hidden");
        } else {
            document.getElementById('notdicom').classList.remove("hidden");
            document.getElementById('start').classList.remove("hidden");
            document.getElementById('response').classList.add("hidden");
            document.getElementById("file-upload-form").reset();
        }
    }

    function setProgressMaxValue(e) {
        var pBar = document.getElementById('file-progress');

        if (e.lengthComputable) {
            pBar.max = e.total;
        }
    }

    function updateFileProgress(e) {
        var pBar = document.getElementById('file-progress');

        if (e.lengthComputable) {
            pBar.value = e.loaded;
        }
    }

    function initCanvas() {
        canvas.offsetwidth = radiography.width();
        canvas.offsetheight = radiography.height();
        canvas.width = radiography.width();
        canvas.height = radiography.height();
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.lineWidth = 3;
        const showLabels = [];
        for (let i = 0; i < boxes256.length; i++) {
            if (scores[i] * 100 >= slider.val()) {
                const color = getRandomColor();
                ctx.strokeStyle = color;
                ctx.fillStyle = color;
                const box256 = boxes256[i];
                const x1_256 = boxes256[i][0];
                const y1_256 = boxes256[i][1];
                const x2_256 = boxes256[i][2];
                const y2_256 = boxes256[i][3];
                const x1 = radiography.width() / 256 * x1_256;
                const y1 = radiography.height() / 256 * y1_256;
                const x2 = radiography.width() / 256 * x2_256;
                const y2 = radiography.height() / 256 * y2_256;
                ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
                ctx.font = "18px Arial";
                ctx.fillText(labelTexts[labels[i]], x1, y1 - 8);
                if (showLabels.indexOf(labelTexts[labels[i]]) == -1) {
                    showLabels.push(labelTexts[labels[i]]);
                }
            }
        }
        showMessage(showLabels.join(', '));
    }

    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    /*==================================================================
    [ Radiography ]*/
    radiography.on("load", function () {
        clearCanvas();
        initCanvas();
        draw();
        originalImageSize[0] = this.naturalWidth;
        originalImageSize[1] = this.naturalHeight;
    }).each(function () {
        if (this.complete) {
            $(this).trigger('load')
        };
    });

    /*==================================================================
    [ Close ]*/
    $('.container-result .result .close').on('click', function (e) {
        e.preventDefault();
        popup(false, '');
        showResut(false, '../images/radiography.png', '');
        document.location.reload(true);
    });

    /*==================================================================
    [ Image ]*/
    function showResut(show, image) {
        const result = $('.container-result');
        radiography.attr('src', image);
        if (show) {
            result.show();
        } else {
            result.hide();
        }
    }

    /*==================================================================
    [ Messsage ]*/
    function showMessage(msg) {
        const message = $('.container-result .result .message');
        message.text(msg);
    }

    /*==================================================================
    [ Popup ]*/
    function popup(show, message) {
        $('.container-popup .popup .message').text(message);
        const popup = $('.container-popup');
        if (show) {
            popup.show();
        } else {
            popup.hide();
        }
    }

    /*==================================================================
    [ Window ]*/
    $(window).resize(function () {
        clearCanvas();
        initCanvas();
        draw();
    });

    /*==================================================================
    [ Slide ]*/
    slider.on('input', function () {
        slideValue.text(slider.val() + '%');
        draw();
    });

})(jQuery);