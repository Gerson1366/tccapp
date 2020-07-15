import {Component} from 'react';
import * as React from 'react';
import {View, Button, Text, StyleSheet} from 'react-native';
import Database from '../database';

const db = new Database();

export default class Diagnostic extends Component{

    static navigationOptions = {
        title: 'Diagnostic'
    };

    constructor (props) {
        super(props)
        this.state = {
            list:[],
            listMonth:[],
            listDay:[]
        }
    }

    componentDidMount(){
        this.refresh();
    }

    refresh = () =>{
        this.getAll();
    }

    getAll = () =>{
        this.setState({list:[],listMonth:[],listDay:[]}, () =>{
            db.getConsult().then((data) => {
                var dataTotal = data;
                var d = new Date();
                var d1 = d.toISOString();
                d.setDate(d.getDate()-30);
                var d2 = d.toISOString();
                db.getByDate(d2,d1).then((data) => {
                    var dataMonth = data;
                    var c = new Date();
                    var c1 = c.toISOString();
                    c.setDate(c.getDate()-1);
                    var c2 = c.toISOString();
                    db.getByDate(c2,c1).then((data) => {
                        this.setState({listDay:data,list:dataTotal,listMonth:dataMonth});
                    })
                })
            })
        })
    }

    

    render(){
        return(
            <View>
                <View style={styles.headerTable}>
                    <Text style={styles.textAlign}>Kanjis Vistos Total</Text>
                </View>
                <View style={styles.contentHeaderTable}>
                    <View key={0} style={styles.viewContent}><Text style={styles.viewContentText}>Kanji</Text></View>
                    <View key={1} style={styles.viewContent}><Text style={styles.viewContentText}>Som</Text></View>
                    <View key={2} style={styles.viewContent}><Text style={styles.viewContentText}>Vezes Visto</Text></View>
                </View>
                {this.state.list.map((row, i) =>
                <View style={styles.contentHeaderTable}>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.character}</Text></View>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.sound}</Text></View>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.times}</Text></View>
                </View>
                )}

                <View style={styles.headerTable}>
                    <Text style={styles.textAlign}>Kanjis Vistos no Mês</Text>
                </View>
                <View style={styles.contentHeaderTable}>
                    <View key={0} style={styles.viewContent}><Text style={styles.viewContentText}>Kanji</Text></View>
                    <View key={1} style={styles.viewContent}><Text style={styles.viewContentText}>Som</Text></View>
                    <View key={2} style={styles.viewContent}><Text style={styles.viewContentText}>Vezes Visto</Text></View>
                </View>
                {this.state.listMonth.map((row, i) =>
                <View style={styles.contentHeaderTable}>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.character}</Text></View>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.sound}</Text></View>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.times}</Text></View>
                </View>
                )}

                <View style={styles.headerTable}>
                    <Text style={styles.textAlign}>Kanjis Vistos No Dia</Text>
                </View>
                <View style={styles.contentHeaderTable}>
                    <View key={0} style={styles.viewContent}><Text style={styles.viewContentText}>Kanji</Text></View>
                    <View key={1} style={styles.viewContent}><Text style={styles.viewContentText}>Som</Text></View>
                    <View key={2} style={styles.viewContent}><Text style={styles.viewContentText}>Vezes Visto</Text></View>
                </View>
                {this.state.listDay.map((row, i) =>
                <View style={styles.contentHeaderTable}>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.character}</Text></View>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.sound}</Text></View>
                    <View key={row.kanji_id} style={styles.viewContent}><Text style={styles.viewContentText}>{row.times}</Text></View>
                </View>
                )}
                <Button style={{alignSelf:'flex-end'}} onPress={() =>this.refresh()}
                            title="Atualizar"/>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    headerTable:{
        width:'100%',
        backgroundColor:'black',
        padding:10,
        flex:0
    },
    textAlign:{
        textAlign:'center',
        color:'white'
    },
    contentHeaderTable:{
        flex:0,
        flexDirection:'row',
        borderBottomColor: 'black',
        borderBottomWidth: 2,
    },
    viewContent:{
        flex:1,
    },
    viewContentText:{
        textAlign:'center'
    }
});