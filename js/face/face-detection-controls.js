const inputSize = 512;
const scoreThreshold = 0.5;

function getFaceDetectorOptions() {
    return new faceapi.TinyFaceDetectorOptions({
        inputSize,
        scoreThreshold
    });
}

function getCurrentFaceDetectionNet() {
    return faceapi.nets.tinyFaceDetector;
}

function isFaceDetectionModelLoaded() {
    return !!getCurrentFaceDetectionNet().params;
}