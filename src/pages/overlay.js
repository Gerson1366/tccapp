import React, {Component} from 'react';
import {View, Text} from 'react-native';

export default class Overlay extends Component{
    static navigationOptions = {
        title: 'Overlay'
    };

    render(){
        return(
            <View>
                <Text>Overlay</Text>
            </View>
        )
    }
}