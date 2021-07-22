(function ($) {
    "use strict";
    
    if (!checkCookie()) {
        window.location.href = "index.html";
    }

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
        const m = document.getElementById('messages');
        m.innerHTML = msg;
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
                                showResut(true, 'http://localhost:8000/show/' + result.id + '.png', 'indeterminate');
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

    /*==================================================================
    [ Close ]*/
    $('.container-result .result .close').on('click', function (e) {
        e.preventDefault();
        popup(false, '');
        showResut(false, '../images/radiography.png', '');
        document.location.reload(true);
    });

    /*==================================================================
    [ Result ]*/
    function showResut(show, image, message) {
        $('.container-result .result .message').text(message);
        const result = $('.container-result');
        $('.container-result .result .image').attr('src', image);
        if (show) {
            result.show();
        } else {
            result.hide();
        }
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

})(jQuery);