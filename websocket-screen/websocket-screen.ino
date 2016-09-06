#include <ESP8266WiFi.h>
#include <WebSocketClient.h>
#include <ArduinoJson.h>
#include <Time.h>

#include <Wire.h>
#include "font.h"
#include "screen.h"

#define SSID "DEFINE_ME"                              // insert your SSID
#define PASS "DEFINE_ME"                              // insert your password

#define WEBSOCKET_SERVER "192.168.x.x"
#define WEBSOCKET_PORT 80
#define WEBSOCKET_HOST "192.168.x.x:80"

// You can set your own credentials in credentials.h to override the default settings here
#include "credentials.h"

WebSocketClient webSocketClient;
WiFiClient client;

StaticJsonBuffer<200> jsonBuffer;

void setup(void) {
//ESP.wdtDisable();                               // used to debug, disable wachdog timer,
  Serial.begin(115200);                           // full speed to monitor
  Serial.println("Setup start");
  Wire.begin(0,2);                                // Initialize I2C and OLED Display
  init_OLED();              

// ADC_MODE(ADC_VCC); //ENable ESP.getVcc() 

  connectWifi();
  connectWebsocket();

 clear_display();
}

void connectWifi(){
   reset_display();
  sendStrXY("Connecting to:" ,0,0);  sendStrXY(SSID,1,0);
  WiFi.begin(SSID, PASS);                         // Connect to WiFi network
  while (WiFi.status() != WL_CONNECTED) {         // Wait for connection
    delay(500);
    Serial.print(".");
  }

  clear_display();

  Serial.print("SSID : ");                        // prints SSID in monitor
  Serial.println(SSID);                           // to monitor
  sendStrXY("SSID :" ,0,0);  sendStrXY(SSID,0,7); // prints SSID on OLED

  sendStrXY(localIP().c_str(),2,0);
  Serial.print("Local IP: ");
  Serial.println(WiFi.localIP());                 // Serial monitor prints localIP
}

String localIP() {
  char result[16];
  sprintf(result, "%3d.%3d.%3d.%3d", WiFi.localIP()[0], WiFi.localIP()[1], WiFi.localIP()[2], WiFi.localIP()[3]);
  return String(result);
}

void connectWebsocket() {
   Serial.println("Connecting websocket...");

   if (client.connect(WEBSOCKET_SERVER, WEBSOCKET_PORT)) {
    Serial.println("Websocket Connected");
    sendStrXY("ON ",6,0);
  } else {
    Serial.println("Websocket Connection failed.");
    sendStrXY("OFF ",6,0);
  }

  Serial.println("Doing Handshake...");
  webSocketClient.path = "/";
  webSocketClient.host = WEBSOCKET_HOST;
  if (webSocketClient.handshake(client)) Serial.println("Handshake successful");
  else Serial.println("Handshake failed.");
  
  Serial.println("Sending data to server");

  send("device", "esp8"); //Identify device on connection
  send("time", "get"); //Request time to server
  send("ip", localIP()); //Unable to parse json {"type":"ip", "value":": SyntaxError: Unexpected end of input

  sendStats();
}

void printTime(){

  char result[15];
  sprintf(result, "%02d/%02d %02d:%02d:%02d", day(), month(), hour(),minute(), second());
  sendStrXY(result,0,0);
}
String data;

void loop(void) {
  // server.handleClient();                        // checks for incoming messages
  //clear_display();

    printTime();

  if (second() == 0) sendStats(); //Send stats every minute
  
  if (client.connected()) receiveData();
  else connectWebsocket();

  //delay(1000);

  //https://github.com/esp8266/Arduino/blob/master/doc/libraries.md#esp-specific-apis
  //http://www.bntdumas.com/2015/07/23/how-to-battery-powered-temperature-and-humidity-sensors/
 /* log("Before sleep");
  ESP.deepSleep(1000000 * 5);
  log ("Wake up");*/
}

void sendStats() {
  webSocketClient.sendData("{\"type\":\"stats\", \"reset\":\""+ESP.getResetReason()+"\",\"memory\":"+ESP.getFreeHeap()+",\"vcc\":"+ESP.getVcc()+"}"); 
}

void send(String type, String value) {
   if (client.connected()) webSocketClient.sendData("{\"type\":\""+type+"\", \"value\":\""+value+"\"}"); 
   else Serial.println("Client not connected, unable to send message");

}

void send(String type, long value) {
   if (client.connected()) webSocketClient.sendData("{\"type\":\""+type+"\", \"value\":"+value+"}"); 
   else Serial.println("Client not connected, unable to send message");

}

void log(String str) {
   if (client.connected()) webSocketClient.sendData("{\"type\":\"log\", \"value\":\""+str+"\"}"); 
   else Serial.println("Client not connected, unable to send log");

}

void receiveData(){
    webSocketClient.getData(data);
    if (data.length() > 0) {
      Serial.print("Received data: ");
      Serial.println(data);

      JsonObject& json = jsonBuffer.parseObject(data);
      if (json.success()) processJson(json);

      data = "";
    }
  
}

void processJson(JsonObject& json) {
    String type = json["type"].as<String>();

    if (type.equals("time") ){
      long t = json["value"];
      Serial.print("Setting time: ");
      Serial.println(t);
      setTime(t);  
    } else if (type.equals("notification") ){
      String notification = json["text"].as<String>();
      Serial.print("Got notification: ");
      Serial.println(notification);
      log(notification); 

      sendStrXY(notification.c_str(),2,0);
    }
}

