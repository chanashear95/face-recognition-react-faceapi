//Dependencies
import React from 'react';
import * as faceapi from 'face-api.js';

//Material UI
import Button from '@material-ui/core/Button/';
import Backdrop from '@material-ui/core/Backdrop/'
import CircularProgress from '@material-ui/core/CircularProgress/'

//Imgs
import defaultImg from '../Imgs/user_new.png';

class FacialRecognition extends React.Component {
    constructor(props) {
        super(props)

        this.state = {
            firstImg: defaultImg,
            secondImg: defaultImg,
            noFacesFound: false,
            moreThanOneFace: false,
            matchFound: null,
        }
    }

    async componentDidMount() {
        await this.loadModels();
    }

    loadModels = async () => { //Load face-api models
        try {
            await faceapi.nets.faceExpressionNet.loadFromUri('/models');;
            await faceapi.nets.faceRecognitionNet.loadFromUri('/models');;
            await faceapi.nets.ssdMobilenetv1.loadFromUri('/models');;
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');;
            await faceapi.nets.mtcnn.loadFromUri('/models');;
            await faceapi.nets.faceLandmark68Net.loadFromUri('/models');;
            await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');;
            await faceapi.nets.ageGenderNet.loadFromUri('/models');;
        } catch (e) {
            console.log(e)
        }
    }

    handleFirstImageUpload = (e) => {
        let img = e.target.files[0];
        let canvas = document.getElementById('canvas1');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        this.setState({ firstImg: URL.createObjectURL(img) }, () => { })
    }

    handleSecondImageUpload = (e) => {
        let img = e.target.files[0];
        let canvas = document.getElementById('canvas2');
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, canvas.width, canvas.height);
        this.setState({ secondImg: URL.createObjectURL(img) }, () => { })
    }

    checkMatch = async () => {
        this.setState({ loading: true, matchFound: null }, async () => {
            let firstImg = document.getElementById('first-img');
            let faces = await faceapi.detectAllFaces(firstImg).withFaceLandmarks().withFaceDescriptors().withFaceExpressions().withAgeAndGender();
            faces = faceapi.resizeResults(faces, { height: 300, width: 300 });
            faceapi.draw.drawDetections(document.getElementById('canvas1'), faces);

            switch (faces.length) {
                case 0:
                    this.setState({ noFacesFound: true, loading: false }, () => { });
                    break;
                case 1:
                    this.findMatch(faces[0]);
                    break;
                default:
                    this.setState({ moreThanOneFace: true }, () => { });
                    break;
            }
        })
    }

    findMatch = async (face) => {
        let matchScore = .63;
        let secondImg = document.getElementById('second-img');
        let faces = await faceapi.detectAllFaces(secondImg).withFaceLandmarks().withFaceDescriptors();
        let labledFace = new faceapi.LabeledFaceDescriptors('Face', [face.descriptor]);
        let faceMatcher = new faceapi.FaceMatcher(labledFace, matchScore);

        let results = await faces.map(f => {
            return faceMatcher.findBestMatch(f.descriptor);
        })
        if (results.findIndex(i => i._label == "Face") !== -1) {
            let matched = [faces[results.findIndex(i => i._label == "Face")]];
            matched = faceapi.resizeResults(matched, { height: 300, width: 300 });
            faceapi.draw.drawDetections(document.getElementById('canvas2'), matched, { withScore: false });

            this.setState({ matchFound: "found", loading: false }, () => { })
        }
        else {
            this.setState({ matchFound: "not found", loading: false }, () => { })
        }
    }


    render() {
        return (
            <div className="main">
                <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={this.handleFirstImageUpload}
                />

                <div className="img-container" style={{ position: 'relative' }}>
                    <img
                        id="first-img"
                        src={this.state.firstImg}
                        style={{ height: 300, width: 300 }}
                    />
                    <canvas id="canvas1" width="300px" height="300px"></canvas>
                </div>


                <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg"
                    onChange={this.handleSecondImageUpload}
                />

                <div className="img-container" style={{ position: 'relative' }}>
                    <img
                        id="second-img"
                        src={this.state.secondImg}
                        style={{ height: 300, width: 300 }}
                    />
                    <canvas id="canvas2" width="300px" height="300px"></canvas>
                </div>

                <Button
                    onClick={this.checkMatch}
                    disabled={!this.state.firstImg || !this.state.secondImg}
                    variant="contained" color="primary" style={{ margin: '10px auto' }}>
                    Check Match
                </Button>

                {this.state.matchFound == "found" ?
                    <p>Match Found!!</p>
                    : this.state.matchFound == "not found" ?
                        <p>No matches found</p>
                        : ""}

                {this.state.noFacesFound ?
                    <p>No faces found in first image. Please upload image with 1 face</p>
                    : ""}

                {this.state.moreThanOneFace ?
                    <p>More than one face found in first image. Pleae upload photo with only one face</p>
                    : ""}

                {this.state.loading ?
                    <Backdrop open={this.state.loading}
                        style={{ zIndex: 100000, color: 'fff' }}>
                        <p style={{ color: '#fff', fontSize: 20, fontWeight: 900 }}>Analyzing images...</p>
                        <CircularProgress color="secondary" />
                    </Backdrop>
                    : ""}
            </div>
        )
    }
}


export default FacialRecognition;