#include <Arduino.h>
#include <ArduinoJson.h>

StaticJsonDocument<96> incomingCommand;

#define PULSE_LENGTH 100
#define MODE_SINGLE false
#define MODE_MULTI true

int relayPin[] = {2};
bool relayState[] = {1};

int inputPin[] = {13};
bool lastState[] = {0};
uint64_t pulseTimer[] = {0, 0};

String command[] = {
  "Recoiler",
  "Leveller",
  "Coiler",
  "Feeder",
  "Punching", // untuk count
  "Feeding", // untuk perintah jalan drive
  "Mode",
  "Pong"
};

bool runningMode = MODE_SINGLE;

// fn
void pulseStateChange(int inputPin, bool *lastState, uint64_t *pulseTimer, bool *output, int cmd);
void holdStateChange(int inputPin, bool *lastState, bool *output, int cmd);
void handleStatusChange(int index, bool cmd);
void handleDeserializeCommand();

void setup() {
  // serial init
  Serial.begin(9600);

  // initialize relay pin
  // for (size_t i = 0; i < sizeof(relayPin)/sizeof(relayPin[0]); i++) {
  //   pinMode(relayPin[i], OUTPUT);
  //   digitalWrite(relayPin[i], relayState[i]);
  // }

  // initialize input pin
  for (size_t i = 0; i < sizeof(inputPin)/sizeof(inputPin[0]); i++) {
    pinMode(inputPin[i], INPUT_PULLUP);
  }
}

void loop() {

  // S-R pin 0-3
  // for (size_t i = 0; i < 4; i++) {
  //   holdStateChange(inputPin[i], &lastState[i], &relayState[i], i);
  //   digitalWrite(relayPin[i], relayState[i]);
  // }

  // if(runningMode == MODE_MULTI){
  //   // MODE MULTI
  //   pulseStateChange(inputPin[4], &lastState[4], &pulseTimer[0], &relayState[4], 4);
  //   digitalWrite(relayPin[4], relayState[4]);
  // } else {
  //   // MODE SINGLE
  //   pulseStateChange(inputPin[5], &lastState[5], &pulseTimer[0], &relayState[4], 4);
  //   digitalWrite(relayPin[4], relayState[4]);
  // }

  // // DRIVE RUN
  // pulseStateChange(inputPin[6], &lastState[6], &pulseTimer[1], &relayState[5], 5);
  // digitalWrite(relayPin[5], relayState[5]);

  // DESERIALIZE SERIAL COMMAND
  if(Serial.available() > 0) handleDeserializeCommand();

  // COUNTER SEND DATA
  pulseStateChange(inputPin[0], &lastState[0], &pulseTimer[0], &relayState[0], 4);

  delay(100);

}


void handleDeserializeCommand() {
  deserializeJson(incomingCommand, Serial);

  const char* cmd = incomingCommand["command"];
  int value = incomingCommand["value"];
  
  if(String(cmd) == String("Ping")) {
    handleStatusChange(8, true);
  }
}


void holdStateChange(int inputPin, bool *lastState, bool *output, int cmd) {
  bool reading = digitalRead(inputPin);
  if(*lastState != reading) {
    if(reading == 1) {
      *output = !*output;
      handleStatusChange(cmd, *output);
    }
    *lastState = reading;
  }
}

void pulseStateChange(int inputPin, bool *lastState, uint64_t *pulseTimer, bool *output, int cmd) {
  bool reading = digitalRead(inputPin);
  if((*lastState == 0) && (reading == 1)) {
    *output = 0;
    *lastState = 1;
    *pulseTimer = millis() + PULSE_LENGTH;
    handleStatusChange(cmd, *output);
  } else if(reading == 0) {
    *lastState = 0;
  }

  if(millis() > *pulseTimer) {
    *output = 1;
  }
}

void handleStatusChange(int cmd, bool output) {
  Serial.print("{\"command\": \"");
  Serial.print(command[cmd]);
  Serial.print("\" ,\"value\": ");
  Serial.print(!output);
  Serial.println("}");
}