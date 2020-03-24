#!/usr/bin/env python
import serial
s = serial.Serial('/dev/ttyUSB0', 9600)
s.write(serial.to_bytes([0x7F,0x00,0x01,0x01,0x05,0x88]))
