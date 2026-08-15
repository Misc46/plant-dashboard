#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* WIFI_SSID     = "SSID";
const char* WIFI_PASSWORD = "PW";
const char* MQTT_BROKER   = "ipconfig"; 
const int   MQTT_PORT     = 1883;
const char* TOPIC_OUTPUT  = "esp32plant/output";  
const char* TOPIC_CONTROL = "esp32plant/control";

float simulatedPV = 10.0;         
float currentControlValue = 0.0; 
const float MAX_LEVEL = 100.0;   
const float MIN_LEVEL = 0.0;    

unsigned long lastPublish = 0;
unsigned long lastPhysicsUpdate = 0;
const long publishInterval = 1000; 

WiFiClient espClient;
PubSubClient client(espClient);

void setupWiFi() {
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi Connected! IP: ");
  Serial.println(WiFi.localIP());
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);

  if (error) {
    Serial.print("JSON Parse Failed: ");
    Serial.println(error.f_str());
    return;
  }

  if (doc.containsKey("controlValue")) {
    currentControlValue = doc["controlValue"];
    Serial.print("Received Pump Command (CV): ");
    Serial.print(currentControlValue);
    Serial.println("%");
  }
}

void reconnectMQTT() {
  while (!client.connected()) {
    Serial.print("Connecting to MQTT Broker...");
    String clientId = "ESP32TankSim-" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str())) {
      Serial.println("Connected!");
      client.subscribe(TOPIC_CONTROL);
    } else {
      Serial.print("Failed (rc=");
      Serial.print(client.state());
      Serial.println("). Retrying in 5s...");
      delay(5000);
    }
  }
}

void updateTankPhysics() {
  unsigned long now = millis();
  float dt = (now - lastPhysicsUpdate) / 1000.0;
  lastPhysicsUpdate = now;

  if (dt <= 0) return;
  float inflow = (currentControlValue / 100.0) * 2.5; 
  float outflow = 0.2 + (sqrt(max(0.0f, simulatedPV)) * 0.15);

  simulatedPV += (inflow - outflow) * dt;

  simulatedPV = constrain(simulatedPV, MIN_LEVEL, MAX_LEVEL);
}

void setup() {
  Serial.begin(115200);
  setupWiFi();
  client.setServer(MQTT_BROKER, MQTT_PORT);
  client.setCallback(mqttCallback);
  lastPhysicsUpdate = millis();
}

void loop() {
  if (!client.connected()) {
    reconnectMQTT();
  }
  client.loop();

  updateTankPhysics();

  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;

    StaticJsonDocument<128> doc;
    doc["processVariable"] = serialized(String(simulatedPV, 2));

    char buffer[128];
    serializeJson(doc, buffer);
    client.publish(TOPIC_OUTPUT, buffer);

    Serial.print("Tank Level Published (PV): ");
    Serial.print(buffer);
    Serial.println("%");
  }
}