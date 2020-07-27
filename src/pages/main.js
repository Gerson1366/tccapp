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
import {fetch, decodeJpeg, bundleResourceIO} from '@tensorflow/tfjs-react-native';
import * as jpeg from 'jpeg-js';
import * as ImageManipulator from "expo-image-manipulator";
import Database from '../database';
import Encoding from 'encoding-japanese';
import ImagePicker from 'react-native-image-picker';
import translate from 'google-translate-open-api';

const db = new Database();

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
          photoSizes:{
              width:null,
              height:null
          },
          imageSizes:{
              width:null,
              height:null,
              x:null,
              y:null
          },
          canvas: null,
          charCollection: [],
          sounds : [],
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
          image: null,
          kanjiString: "",
          format:null,
          translation:""
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
        //console.log(data);
        // Drop the alpha channel info for mobilenet
        const buffer = new Uint8Array(width * height * 1)
        let offset = 0 // offset into original data
        let pixel;
        var contrast = (20/100) + 1; //porcentagem de contraste
        //console.log("Contraste: ",contrast);
        var intercept = 128 * (1 - contrast);
        for (let i = 0; i < buffer.length; i += 1) {
          //console.log(offset);
          //pixel = (data[offset]*contrast+intercept)+(data[offset+1]*contrast+intercept)+(data[offset+2]*contrast+intercept)
          
          //buffer[i] = (pixel/3)/255
          //pixel = 0
          //buffer[i] = data[offset+2]/255
          pixel = (((data[offset] + data[offset + 1] + data[offset + 2])/3)+100);
          /*if((pixel/3)<100){
              pixel = 0
          }else{
              pixel = 1
          }*/
          //console.log(pixel/255)
          buffer[i]=(pixel/255)
          offset += 4
        }
        //console.log(buffer);
        var imgTensor = tf.tensor3d(buffer, [ height, width, 1])
        
        imgTensor = tf.image.resizeBilinear(imgTensor, [32, 32]).toFloat();
        //imgTensor = tf.scalar(1.0).sub(imgTensor.div(offset));
        //const offset2 = tf.scalar(255.0);
        //imgTensor = imgTensor.sub(offset2).div(offset2);
        imgTensor = imgTensor.expandDims(0);
        //imgTensor = tf.cast(imgTensor,"float32");
        return imgTensor;
        //return tf.reshape(floatImage,[1,32,32,1])
      }

      classifyImage = async () => {
        try {
            const imageAssetPath = Image.resolveAssetSource(this.state.image)
            console.log(imageAssetPath.uri);
            const imgB64 = await FileSystem.readAsStringAsync(imageAssetPath.uri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            //console.log('imgB64: ',imgB64);
            const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
            const raw = new Uint8Array(imgBuffer)
            //console.log('raw: ',raw);
            //console.log('imgBuffer: ',imgBuffer);
            const imageTensor = this.imageToTensor(raw);
            //const imageRaw = decodeJpeg(raw);
            //const imageFloat = tf.cast(imageRaw,"float32");
            //const imageTensor = tf.reshape(imageFloat,[1,32,32,1]);
            //console.log('imageTensor: ', imageFloat);
           // console.log((await this.state.model).summary());
            //console.log(this.state.model)
            
            const predictions = await this.state.model.predict(imageTensor).argMax(1).dataSync();
            //this.setState({ predictions: predictions })
            //console.log(this.state.model.getWeights()[0].print());
            console.log('----------- predictions: ', predictions);
            //console.log('----------- predictions: ', predictions.argMax(1).dataSync());
            db.getKanji(predictions[0]).then((data) => {
                console.log(data);
                console.log("Data kanji: ",data.character);
                var kanjiString = this.state.kanjiString;
                kanjiString = kanjiString+data.character;
                var charCollection = this.state.charCollection;
                charCollection.push(data.number);
                var sounds = this.state.sounds;
                sounds.push(data.sound);
                console.log(charCollection);
                this.setState({kanjiString:kanjiString, charCollection:charCollection});
                translate(kanjiString, {
                    tld: "jp",
                    to: "pt",
                }).then((data) => {
                    this.setState({translation:data.data[0]});
                })
            }).catch((err) => {
                console.log(err);
            });
        } catch (error) {
          console.log("Erro: ",error)
        }
      }

    addToBase = () =>{
        db.addConsult(this.state.charCollection);
        this.setState({kanjiString:"",translation:"",charCollection:[]});
    }

    removeLast = () =>{
        var kanjiString = this.state.kanjiString;
        kanjiString = kanjiString.substring(0,kanjiString.length-1);
        var charCollection = this.state.charCollection;
        charCollection.pop();
        var sounds = this.state.sounds;
        sounds.pop();
        this.setState({kanjiString:kanjiString, charCollection:charCollection});
    }

    cropImage = () => {
        this.captureComponent.measure( (fx, fy, width, height, px, py) => {
            console.log("Xget: ",px);
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
            const imageData = d;
            const imagePath = RNFS.ExternalDirectoryPath + '/image.jpeg';
            //const imagePath = RNFS.DocumentDirectoryPath + '/image.jpeg';
            const base64Data = imageData.split('base64,')[1];
            RNFS.writeFile(imagePath, base64Data, 'base64')
                .then(() =>{
                console.log('Image converted to jpg and saved at ' + imagePath);
                var imageUri = 'file://'+imagePath;
                
                var uriImage = {uri: 'file://'+imagePath};
                //var uriImage = {uri: 'file:///storage/emulated/0/Android/data/com.tccapp/files/oki.jpg'};
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

    getImageSize = (event) =>{
        this.setState({
            imageSizes:{
                width:event.nativeEvent.layout.width,
                height:event.nativeEvent.layout.height,
                x:event.nativeEvent.layout.x,
                y:event.nativeEvent.layout.y
            }
        })
    }

    mountCanvas = (data,x,y,height,width) =>{
        var canvas = this.state.canvasB;
        const image = new CanvasImage(canvas);
        var widthC = 32;
        var heightC = 32;
        canvas.width = widthC;
        canvas.height = heightC;
        var resizeWidth
        var resizeHeight
        var xDelay
        if(this.state.format==='camera'){
            resizeWidth = (this.state.photoSizes.width/this.state.imageSizes.width);
            resizeHeight = (this.state.photoSizes.height/this.state.imageSizes.height);
        }else{
            resizeWidth = (this.state.photoSizes.width/this.state.imageSizes.width)*1.5;
            resizeHeight = (this.state.photoSizes.height/this.state.imageSizes.height);
            xDelay = 68.4;
        }
        console.log("Resize: ",resizeWidth);
        console.log("Resize: ",resizeHeight);
        console.log("X: ",this.state.imageSizes.x)
        this.setState({canvasB:canvas});
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, widthC, heightC);
        image.src = data;
        //image.src = "data:image/jpeg;base64,"+data;
        //'https://image.freepik.com/free-vector/unicorn-background-design_1324-79.jpg'; Note: with this uri everything works well
        image.addEventListener('load', () => {
            debugger
            
            console.log('image is loaded');
            context.clearRect(10, 10, widthC, heightC);

            if(this.state.format==='camera'){
                context.drawImage(image, x*resizeWidth, y*resizeHeight, width*resizeWidth, height*resizeHeight,0,0,widthC,heightC);
            }else{
                console.log("Xposition: ",((x+xDelay)*resizeWidth));
                context.drawImage(image, ((x-xDelay)*resizeWidth), y*resizeHeight, width*resizeWidth, height*resizeHeight,0,0,widthC,heightC);
            }

            context.globalCompositeOperation='difference';
            context.fillStyle='white';
            context.fillRect(0,0,widthC,heightC);

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
        var soundsString = "";
        for(var i=0;i<this.state.sounds.length;i++){
            soundsString = soundsString+this.state.sounds[i]+" ";
        }
        if(this.state.view=='start'){
            if(this.state.image!=null){
                var imageCanvas = this.state.image;
                console.log(imageCanvas);
            }else{
                var imageCanvas = null;
            }
            return(
                <View>
                    {/*<Button onPress={() =>this.openCamera()}
                            title="Usar Câmera"/>*/}
                    <Button onPress={() =>this.chooseFile()}
                            title="Enviar Arquivo"/>
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
                    <Image style={styles.image} source={{uri:this.state.photoData}} onLayout={(event) => {this.getImageSize(event)}} />
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
                        <View style={{width:'100%',height:120,backgroundColor:"white",justifyContent: 'flex-start',}}>
                            <Canvas style={styles.canvas} ref={canvasB => this.state.canvasB = canvasB} />
                            <Text style={{width:'100%',height:100,backgroundColor:'red'}}>{this.state.kanjiString}</Text>
                        </View>
                    
                    <TouchableOpacity onPress={() => this.closeCamera()} style={styles.capture}>
                        <Text style={{ fontSize: 14 }}> Cancelar </Text>
                    </TouchableOpacity>
                </View>
            );
        }else if(this.state.view=='upload'){
            return (
                <View style={styles.container}>
                    <Image style={styles.imageUpload} source={{uri:this.state.photoData}} onLayout={(event) => {this.getImageSize(event)}} />
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
                        <View style={{width:'100%',height:120,backgroundColor:"white",justifyContent: 'flex-start',flexDirection: 'column',}}>
                            <Canvas style={styles.canvas} ref={canvasB => this.state.canvasB = canvasB} />
                            <Text style={{width:'100%'}}>{this.state.kanjiString}</Text>
                            <Text style={{width:'100%'}}>{soundsString}</Text>
                            <Text style={{width:'100%'}}>{this.state.translation}</Text>
                            <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'center' }}>
                                <TouchableOpacity onPress={() => this.removeLast()} style={styles.removeButton}>
                                    <Text style={{color:'white',textAlign:'center'}}>X</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => this.addToBase()} style={styles.addButton}>
                                    <Text style={{color:'white',textAlign:'center'}}>✓</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    
                    <TouchableOpacity onPress={() => this.closeCamera()} style={styles.capture}>
                        <Text style={{ fontSize: 14 }}> Cancelar </Text>
                    </TouchableOpacity>
                </View>
            );
        }
      }

      chooseFile = () =>{
        const options = {
            title: 'Selecione uma imagem',
            takePhotoButtonTitle: null,
            storageOptions: {
                skipBackup: true,
                path: 'images',
            },
        };
        ImagePicker.showImagePicker(options, (response) => {
            if (response.didCancel) {
                console.log('User cancelled image picker');
              } else if (response.error) {
                console.log('ImagePicker Error: ', response.error);
              } else {
                this.sendFile(response.uri);
              }
        });
      }

      sendFile = (img) =>{
          var img = img;
          console.log(img);
          Image.getSize(img, (width, height) => {
              console.log("Image wid: ",width)
              console.log("Image hei: ",height)
            RNFetchBlob.fs.readFile(img, 'base64')
            .then((data) => {
                var data = "data:image/jpeg;base64,"+data;
                this.setState({view:'upload',format:'upload',photoData:data,photoSizes:{ width:width*2,height:height*2}});
                //console.log(data.uri);
            });
          }, (error) => {
            
          });
      }
    
      takePicture = async () => {
        if (this.camera) {
          const options = { quality: 1, base64: true };
          const data = await this.camera.takePictureAsync(options)
          var widthD = data.width;
          var heightD = data.height;
          RNFetchBlob.fs.readFile(data.uri, 'base64')
            .then((data) => {
                var data = "data:image/jpeg;base64,"+data;
                this.setState({view:'image',format:'upload',photoData:data,photoSizes:{ width:widthD,height:heightD}});
                //console.log(data.uri);
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
        alignItems: 'flex-start',
        resizeMode: 'stretch',
        zIndex:0
    },
    imageUpload:{
        flex:1,
        flexGrow: 1,
        justifyContent: 'flex-end',
        alignItems: 'flex-start',
        resizeMode: 'contain',
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
    removeButton:{
        width:15,
        height:15,
        backgroundColor:'red',
        justifyContent:'center',
        margin:10
    },
    addButton:{
        width:15,
        height:15,
        backgroundColor:'green',
        justifyContent:'center',
        margin:10
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