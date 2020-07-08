import React, {Component} from 'react';
import { Image, Button, StyleSheet, Text, TouchableOpacity, TouchableHighlight, View, Dimensions, ImageBackground, SafeAreaView, ScrollView } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Gestures from 'react-native-easy-gestures';
import ImageEditor from "@react-native-community/image-editor";
import Canvas, {Image as CanvasImage} from 'react-native-canvas';
import RNPhotoManipulator from 'react-native-photo-manipulator';
import RNFetchBlob from 'react-native-fetch-blob';



export default class Main extends Component{
    constructor (props) {
        super(props)
        this.state = {
          view: 'start',
          photoData: null, 
          canvas: null,
          text:"Po",
          canvasB:{
            width: 100,
            height: 100
          },
          canvasA: {
            width: 100,
            height: 100
          }
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
            //RNFetchBlob.fs.readFile(this.state.photoData, 'base64')
            //.then((data) => {
                //const image = "data:image/jpeg;base64,"+data;
                //this.mountCanvas(data,px,py,width,height);
                /*var cropData = {
                    offset: {x: px, y: py},
                    size: {width: width, height: height},
                };
                ImageEditor.cropImage(image, cropData).then(url => {
                    console.log("Cropped image uri", url);
                })*/
                /*const cropRegion = { x: px, y: py, size: height, width: width };
                const targetSize = { size: height, width: width };
                RNPhotoManipulator.crop(image, cropRegion, targetSize).then(path => {
                    console.log(`Result image path: ${path}`);
                    this.mountCanvas(data);
                });*/
            //})
            //var uri = this.state.photoData;
            //var cropData = {
            //    offset: {x: px, y: py},
            //    size: {width: width, height: height},
            //};
            //ImageEditor.cropImage(uri, cropData).then(url => {
            //    console.log("Cropped image uri", url);
            //})
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
                context.drawImage(image, 0, 0, 100, 100);
            })
        );
    }

    mountCanvas = (data,x,y,height,width) =>{
        const image = new CanvasImage(this.state.canvasB);
        image.crossOrigin = '*';
        
        const context = this.state.canvasB.getContext('2d');
        context.clearRect(0, 0, width, height);
        image.src = data;
        //image.src = "data:image/jpeg;base64,"+data;

        //'https://image.freepik.com/free-vector/unicorn-background-design_1324-79.jpg'; Note: with this uri everything works well
        image.addEventListener('load', () => {
            debugger
            console.log('image is loaded');
            context.clearRect(10, 10, 100, 100);
            context.drawImage(image, x*5, y*4.7, width*5, height*5,0,0,width,height);

            context.globalCompositeOperation='difference';
            context.fillStyle='white';
            context.fillRect(0,0,100,100);
        }); 
    }

    handleCanvas =  (canvas) => {
        const image = new CanvasImage(canvas);
        image.crossOrigin = '*';
        canvas.width = 100;
        canvas.height = 100;
        
        const context = canvas.getContext('2d');

        image.src = 'https://4.bp.blogspot.com/-znfmwJ_BRao/Two2Df7EEhI/AAAAAAAAB6s/JR4FXeKPIFo/s1600/ai.jpg';

        //'https://image.freepik.com/free-vector/unicorn-background-design_1324-79.jpg'; Note: with this uri everything works well

        image.addEventListener('load', () => {
            debugger
            console.log('image is loaded');
            context.drawImage(image, 0, 0, 100, 100);

            context.globalCompositeOperation='difference';
            context.fillStyle='white';
            context.fillRect(0,0,100,100);
        }); 
        this.setState({canvas:canvas});
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
                <Canvas style={{display:'none'}} ref={canvasA => this.state.canvasA = canvasA} />
                <RNCamera
                ref={(ref) => {
                    this.camera = ref;
                }}
                style={styles.preview}
                type={RNCamera.Constants.Type.back}
                //flashMode={RNCamera.Constants.FlashMode.on}
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
                            <Canvas style={{flex:1}} ref={canvasB => this.state.canvasB = canvasB} />
                            <Text>{this.state.Text}</Text>
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