import React from 'react';
import { StyleSheet, Image, Text, View} from 'react-native';
import { createAppContainer, createSwitchNavigator } from 'react-navigation'; 
import { createBottomTabNavigator } from 'react-navigation-tabs';

import TransactionScreen from './screens/BookTransactionScreen';
import SearchScreen from './screens/SearchScreen';
import LoginScreen from './screens/Login'

export default class App extends React.Component {
  render() {
    return (
      <AppContainer />
    )
  }
}

const TabNavigator = createBottomTabNavigator({
  Transaction: {screen:TransactionScreen},
  Search: {screen:SearchScreen}
},
  {
    defaultNavigationOptions : ({navigation})=>({
      tabBarIcon : ()=>{
        const routeName = navigation.state.routeName;
        if(routeName === "Transaction"){
          return(
            <Image
              source = {require("./assets/book.png")}
              style = {{width:40, height:40}}
            />
          )
        }

        else if(routeName === "Search"){
          return(
            <Image
              source = {require("./assets/searchingbook.png")}
              style = {{width:40, height:40}}
            />
          )
        }
      }
    })
  }
);

const switchNavigator = createSwitchNavigator({
  LoginScreen : {screen: LoginScreen},
  TabNavigator : {screen: TabNavigator}
})

const AppContainer = createAppContainer(switchNavigator)

const styles = StyleSheet.create({
  container:{
    flex:1,
    backgroundColor:'red',
    alignItems:'center',
    justifyContent:'center'
  }
})
