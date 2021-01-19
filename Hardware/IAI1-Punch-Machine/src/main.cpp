#include <Arduino.h>
#include <ArduinoJson.h>

StaticJsonDocument<96> incomingCommand;

#define PULSE_LENGTH 500
#define MODE_SINGLE false
#define MODE_MULTI true

int relayPin[] = { 2, 3, 4, 5, 6, 7, 8, 9 };
bool relayState[] = {1, 1, 1, 1, 1, 1, 1, 1 };

int inputPin[] = {13, 12, 11, 10, A5, A4, A3, A2, A1, A0};
bool lastState[] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0};
uint64_t pulseTimer[] = {0, 0};

String command[] = {
  "Recoiler",
  "Leveller",
  "Coiler",
  "Feeder",
  "Punching", // untuk count
  "Feeding", // untuk perintah jalan drive
  "Mode"
};

bool runningMode = MODE_SINGLE;

// fn
void pulseStateChange(int inputPin, bool *lastState, uint64_t *pulseTimer, bool *output, int index);
void holdStateChange(int inputPin, bool *lastState, bool *output, int index);
void handleStatusChange(int index, bool output);
void handleDeserializeCommand();

void setup() {
  // serial init
  Serial.begin(9600);

  // initialize relay pin
  for (size_t i = 0; i < sizeof(relayPin)/sizeof(relayPin[0]); i++) {
    pinMode(relayPin[i], OUTPUT);
    digitalWrite(relayPin[i], relayState[i]);
  }

  // initialize input pin
  for (size_t i = 0; i < sizeof(inputPin)/sizeof(inputPin[0]); i++) {
    pinMode(inputPin[i], INPUT);
  }
}

void loop() {

  // S-R pin 0-3
  for (size_t i = 0; i < 4; i++) {
    holdStateChange(inputPin[i], &lastState[i], &relayState[i], i);
    digitalWrite(relayPin[i], relayState[i]);
  }

  if(runningMode == MODE_MULTI){
    // MODE MULTI
    pulseStateChange(inputPin[4], &lastState[4], &pulseTimer[0], &relayState[4], 4);
    digitalWrite(relayPin[4], relayState[4]);
  } else {
    // MODE SINGLE
    pulseStateChange(inputPin[5], &lastState[5], &pulseTimer[0], &relayState[4], 4);
    digitalWrite(relayPin[4], relayState[4]);
  }

  // DRIVE RUN
  pulseStateChange(inputPin[6], &lastState[6], &pulseTimer[1], &relayState[5], 5);
  digitalWrite(relayPin[5], relayState[5]);

  // DESERIALIZE SERIAL COMMAND
  if(Serial.available() > 0) handleDeserializeCommand();

  delay(10);

}


void handleDeserializeCommand() {
  deserializeJson(incomingCommand, Serial);

  const char* cmd = incomingCommand["command"];
  int value = incomingCommand["value"];
  
  if(String(cmd) == String("Mode")) {
    runningMode = value;
    handleStatusChange(6, !value);
  }
}


void holdStateChange(int inputPin, bool *lastState, bool *output, int index) {
  bool reading = digitalRead(inputPin);
  if(*lastState != reading) {
    if(reading == 1) {
      *output = !*output;
      handleStatusChange(index, *output);
    }
    *lastState = reading;
  }
}

void pulseStateChange(int inputPin, bool *lastState, uint64_t *pulseTimer, bool *output, int index) {
  bool reading = digitalRead(inputPin);
  if((*lastState == 0) && (reading == 1)) {
    *output = 0;
    *lastState = 1;
    *pulseTimer = millis() + PULSE_LENGTH;
    handleStatusChange(index, *output);
  } else if(reading == 0) {
    *lastState = 0;
  }

  if(millis() > *pulseTimer) {
    *output = 1;
  }
}

void handleStatusChange(int index, bool output) {
  Serial.print("{\"command\": \"");
  Serial.print(command[index]);
  Serial.print("\" ,\"value\": ");
  Serial.print(!output);
  Serial.println("}");
}