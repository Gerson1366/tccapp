import React, {Component} from 'react';
import { AppRegistry, Button, StyleSheet, Text, TouchableOpacity, TouchableHighlight, View, ImageBackground } from 'react-native';
import { RNCamera } from 'react-native-camera';
import Gestures from 'react-native-easy-gestures';
import ImageEditor from "@react-native-community/image-editor";
import Canvas, {Image as CanvasImage} from 'react-native-canvas';




export default class Main extends Component{
    constructor (props) {
        super(props)
        this.state = {
          view: 'start',
          photoData: null
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
            uri = this.state.photoData;
            console.log(uri);
            cropData = {
                offset: {x: px, y: py},
                size: {width: width, height: height},
            };
            ImageEditor.cropImage(uri, cropData).then(url => {
                console.log("Cropped image uri", url);
            })
        });
    };

    handleCanvas =  (canvas) => {
        const image = new CanvasImage(canvas);
        canvas.width = 100;
        canvas.height = 100;
        
        const context = canvas.getContext('2d');

        image.src = 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx112748-TkfRFNCgQFQX.jpg';

        //'https://image.freepik.com/free-vector/unicorn-background-design_1324-79.jpg'; Note: with this uri everything works well

        image.addEventListener('load', () => {
            debugger
            console.log('image is loaded');
            context.drawImage(image, 0, 0, 100, 100);
        }); 
    }
    
    render() {
        if(this.state.view=='start'){
            return(
                <View>
                    <Button onPress={() =>this.openCamera()}
                            title="Usar Câmera"/>
                    <Canvas ref={this.handleCanvas}/>
                </View>
            );
        }else if(this.state.view=='camera'){
            return (
            <View style={styles.container}>
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
                    <ImageBackground
                    style={styles.image}
                    source={{uri:this.state.photoData}}>
                        <Gestures
                        rotatable={false}
                        
                        >
                        <TouchableHighlight onPress={ () =>{
                            this.cropImage()
                        }}>
                        <View
                            style={{
                            width: 50,
                            height: 50,
                            backgroundColor: "#5BD2D2",
                            opacity: 0.5,
                            zIndex: 10
                            }}
                            ref={view => { this.captureComponent = view; }}
                        />
                        </TouchableHighlight>
                        </Gestures>
                    </ImageBackground>
                    <TouchableOpacity onPress={() => this.closeCamera()} style={styles.capture}>
                        <Text style={{ fontSize: 14 }}> Cancelar </Text>
                    </TouchableOpacity>
                </View>
            );
        }
      }
    
      takePicture = async () => {
        if (this.camera) {
          const options = { quality: 0.5, base64: true };
          const data = await this.camera.takePictureAsync(options);
          this.setState({view:'image',photoData:data.uri})
          console.log(data.uri);
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
        justifyContent: 'flex-end',
        alignItems: 'center',
        zIndex:0
    },
    container: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: 'black',
    },
    preview: {
      flex: 1,
      justifyContent: 'flex-end',
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