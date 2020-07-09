import React, {Component} from 'react';
import { Image, Button, StyleSheet, Text,PermissionsAndroid, TouchableOpacity, TouchableHighlight, View, Dimensions, ImageBackground, SafeAreaView, ScrollView } from 'react-native';
import { Camera } from 'expo-camera';
import Gestures from 'react-native-easy-gestures';
import ImageEditor from "@react-native-community/image-editor";
import Canvas, {Image as CanvasImage} from 'react-native-canvas';
import RNPhotoManipulator from 'react-native-photo-manipulator';
import RNFetchBlob from 'react-native-fetch-blob';
import * as FileSystem from 'expo-file-system';
import * as tf from '@tensorflow/tfjs';
import RNFS from 'react-native-fs';
import {loadGraphModel} from '@tensorflow/tfjs-converter';
import {bundleResourceIO} from '@tensorflow/tfjs-react-native';
import * as jpeg from 'jpeg-js'

class MyInit extends tf.initializers.randomNormal{
    static className = "myInit";
    constructor(config) {
        super(config);
        this.mean = 0.0;
        this.stddev = 0.05;
    }
}

tf.serialization.registerClass(MyInit);

export default class Main extends Component{

    canvas; 

    constructor (props) {
        super(props)
        this.canvasB;
        this.state = {
          view: 'start',
          photoData: null, 
          canvas: null,
          text:"Po",
          canvasB:{width: 32,
            height: 32},
          canvasA: {
            width: 32,
            height: 32
          },
          isTfReady: false,
          isModelReady: false,
          model: null,
          canvasData: null,
          predictions: null,
          image: null
        }
     }

     async componentDidMount() {
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE)
        PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE)
        await tf.ready()
        this.setState({
          isTfReady: true
        })
    
        //Output in Expo console
        //console.log(this.state.isTfReady)
        //const modelJson = require('https://www.inajunkbox.com.br/model_json/model.json');
        //const modelWeights = require('https://www.inajunkbox.com.br/model_json/group1-shard1of1.bin');
        const modelJson = require('../assets/model.json/');
        const modelWeights = require('../assets/group1-shard1of1.bin/');
        //console.log(modelJson);
        tf.loadLayersModel(bundleResourceIO(modelJson, modelWeights)).then(model => {
            this.setState({ isModelReady: true, model:model });
        });
        //console.log((await model).summary());
        //model.summary();
        //const model = tf.loadGraphModel(modelJson);
        
        //console.log(this.state.isModelReady);
        //model.summary();
      }

      imageToTensor(rawImageData) {
        const TO_UINT8ARRAY = true
        const { width, height, data } = jpeg.decode(rawImageData, TO_UINT8ARRAY)
        // Drop the alpha channel info for mobilenet
        const buffer = new Uint8Array(width * height * 3)
        let offset = 0 // offset into original data
        for (let i = 0; i < buffer.length; i += 3) {
          buffer[i] = data[offset]
          buffer[i + 1] = data[offset + 1]
          buffer[i + 2] = data[offset + 2]
    
          offset += 4
        }
    
        return tf.tensor4d(buffer, [1,height, width, 1])
      }

      classifyImage = async () => {
        try {
            const imageAssetPath = Image.resolveAssetSource(this.state.image)
            console.log(imageAssetPath.uri);
            const imgB64 = await FileSystem.readAsStringAsync(imageAssetPath.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
            const raw = new Uint8Array(imgBuffer)
            const imageTensor = this.imageToTensor(raw);
            console.log('imageTensor: ', imageTensor);
            //console.log((await this.state.model).summary());
            //console.log(this.state.model);
            const predictions = await this.state.model.predict(imageTensor);

            //this.setState({ predictions: predictions })


            //console.log('----------- predictions: ', predictions);
        } catch (error) {
          console.log(error)
        }
      }

    cropImage = () => {
        this.captureComponent.measure( (fx, fy, width, height, px, py) => {
            console.log('Component width is: ' + width)
            console.log('Component height is: ' + height)
            console.log('X offset to frame: ' + fx)
            console.log('Y offset to frame: ' + fy)
            console.log('X offset to page: ' + px)
            console.log('Y offset to page: ' + py)
            this.mountCanvas(this.state.photoData,px,py,width,height);
        });
    };

    saveCanvas = () =>{
        const canvasSave = this.state.canvasB;
        canvasSave.toDataURL('image/png').then((d)=>
            this.setState({image:d}, () =>{

                const image = new CanvasImage(this.state.canvasA);
                image.crossOrigin = '*';

                const context = this.state.canvasA.getContext('2d');
                image.src = d;
                context.drawImage(image, 0, 0, 32, 32);
            })
        );
    }

    predictImage = () =>{
        var canvas = this.state.canvasB;
        console.log(canvas.width);
        canvas.toDataURL('image/jpeg').then((d)=>{
            console.log(d);
            const imageData = d;
            //const imagePath = RNFS.ExternalDirectoryPath + '/image.jpeg';
            const imagePath = RNFS.DocumentDirectoryPath + '/image.jpeg';
            const base64Data = imageData.split('base64,')[1];
            RNFS.writeFile(imagePath, base64Data, 'base64')
                .then(() =>{
                console.log('Image converted to jpg and saved at ' + imagePath);
                var uriImage = {uri: 'file://'+imagePath};
                console.log(uriImage);
                this.setState({ image: uriImage  }, () =>{
                    this.classifyImage();
                });
                /*var cropData = {
                    offset: {x: 0, y: 0},
                    size: {width: 32, height: 32}
                };
                ImageEditor.cropImage(
                    uriImage,
                    cropData,
                    (croppedImageURI) => {
                        console.log('succes', croppedImageURI);
                    },
                    (cropError) => {
                        console.log('fail', cropError);
                    }
                );*/
            });
        })
    }

    mountCanvas = (data,x,y,height,width) =>{
        var canvas = this.state.canvasB;
        const image = new CanvasImage(canvas);
        
        canvas.width = 32;
        canvas.height = 32;
        this.setState({canvasB:canvas});
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, 32, 32);
        image.src = data;
        //image.src = "data:image/jpeg;base64,"+data;
        //'https://image.freepik.com/free-vector/unicorn-background-design_1324-79.jpg'; Note: with this uri everything works well
        image.addEventListener('load', () => {
            debugger
            console.log('image is loaded');
            context.clearRect(10, 10, 32, 32);
            context.drawImage(image, x*5, y*5, width*5, height*5,0,0,32,32);

            context.globalCompositeOperation='difference';
            context.fillStyle='white';
            context.fillRect(0,0,32,32);

            this.predictImage();
        }); 
        
    }

    handleCanvas =  (canvas) => {
        this.canvasB = new CanvasImage(canvas);
        this.canvasB.crossOrigin = '*';
        this.canvasB.width = 32;
        this.canvasB.height = 32;
    }
    
    render() {
        if(this.state.view=='start'){
            if(this.state.image!=null){
                var imageCanvas = this.state.image;
                console.log(imageCanvas);
            }else{
                var imageCanvas = null;
            }
            return(
                <View>
                    <Button onPress={() =>this.openCamera()}
                            title="Usar Câmera"/>
                </View>
            );
        }else if(this.state.view=='camera'){
            return (
            <View style={styles.container}>
                <Camera
                ref={(ref) => {
                    this.camera = ref;
                }}
                style={styles.preview}
                type={Camera.Constants.Type.back}
                //flashMode={Camera.Constants.FlashMode.on}
                androidCameraPermissionOptions={{
                    title: 'Permission to use camera',
                    message: 'We need your permission to use your camera',
                    buttonPositive: 'Ok',
                    buttonNegative: 'Cancel',
                }}
                />
                <View style={{ flex: 0, flexDirection: 'row', justifyContent: 'center' }}>
                <TouchableOpacity onPress={this.takePicture.bind(this)} style={styles.capture}>
                    <Text style={{ fontSize: 14 }}> Captura </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => this.closeCamera()} style={styles.capture}>
                    <Text style={{ fontSize: 14 }}> Cancelar </Text>
                </TouchableOpacity>
                </View>
            </View>
            );
        }else if(this.state.view=='image'){
            return (
                <View style={styles.container}>
                    <Image style={styles.image} source={{uri:this.state.photoData}} />
                    <Gestures
                        rotatable={false}
                        
                        >
                        <TouchableHighlight onPress={ (evt) =>{
                            this.cropImage(evt)
                        }}>
                        <View
                            style={{
                            width: 50,
                            height: 50,
                            backgroundColor: "#5BD2D2",
                            position: 'relative',
                            opacity: 0.5,
                            zIndex: 10
                            }}
                            ref={view => { this.captureComponent = view; }}
                        />
                        </TouchableHighlight>
                        </Gestures>
                        <View style={{width:'100%',height:100,backgroundColor:"white",justifyContent: 'flex-start',}}>
                            <Canvas style={styles.canvas} ref={canvasB => this.state.canvasB = canvasB} width={32} height={32} />
                        </View>
                    
                    <TouchableOpacity onPress={() => this.closeCamera()} style={styles.capture}>
                        <Text style={{ fontSize: 14 }}> Cancelar </Text>
                    </TouchableOpacity>
                </View>
            );
        }
      }
    
      takePicture = async () => {
        if (this.camera) {
          const options = { quality: 1, base64: true };
          const data = await this.camera.takePictureAsync(options)
          RNFetchBlob.fs.readFile(data.uri, 'base64')
            .then((data) => {
                var data = "data:image/jpeg;base64,"+data;
                this.setState({view:'image',photoData:data});
                console.log(data.uri);
            });
          
          //this.mountCanvas();
        }
      };

      openCamera = () =>{
          this.setState({view:'camera'});
      }

      closeCamera = () =>{
        this.setState({view:'start'});
    }
}

const styles = StyleSheet.create({
    image:{
        flex:1,
        flexGrow: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
        resizeMode: 'stretch',
        zIndex:0
    },
    imagetest:{
        width:100,
        height:100,
        backgroundColor:'red'
    },  
    canvas:{
        width:32,
        height:32,
        backgroundColor:'red'
    },
    container: {
      flex: 0,
      flexDirection: 'column',
      backgroundColor: 'black',
      borderWidth:1,
      width:'100%',
      flexGrow: 1,
    },
    preview: {
      flex: 1,
      justifyContent: 'flex-end',
      width:'100%',
      alignItems: 'center',
    },
    capture: {
      flex: 0,
      backgroundColor: '#fff',
      borderRadius: 5,
      padding: 15,
      paddingHorizontal: 20,
      alignSelf: 'center',
      margin: 20,
    },
  });