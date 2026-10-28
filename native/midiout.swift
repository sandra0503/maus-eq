// midiout — creates a virtual CoreMIDI source named "Maus EQ" and sends MIDI
// Control Change messages read from stdin. One command per line:
//
//     <channel 0-15> <cc 0-127> <value 0-127>
//
// e.g. "0 16 72"  →  CC#16 = 72 on MIDI channel 1.
//
// Other apps (rekordbox, etc.) see "Maus EQ" as a MIDI input to map.
// No special permission required for a CoreMIDI virtual endpoint.
//
// Build: swiftc midiout.swift -o midiout -framework CoreMIDI -O

import CoreMIDI
import Foundation

func fail(_ msg: String) -> Never {
    FileHandle.standardError.write(("midiout: " + msg + "\n").data(using: .utf8)!)
    exit(1)
}

var client = MIDIClientRef()
if MIDIClientCreate("MausEQClient" as CFString, nil, nil, &client) != noErr {
    fail("could not create MIDI client")
}

var source = MIDIEndpointRef()
if MIDISourceCreate(client, "Maus EQ" as CFString, &source) != noErr {
    fail("could not create virtual source")
}

func sendCC(_ channel: UInt8, _ cc: UInt8, _ value: UInt8) {
    var packetList = MIDIPacketList()
    let first = MIDIPacketListInit(&packetList)
    let bytes: [UInt8] = [0xB0 | (channel & 0x0F), cc & 0x7F, value & 0x7F]
    _ = MIDIPacketListAdd(&packetList, MemoryLayout<MIDIPacketList>.size, first, 0, bytes.count, bytes)
    MIDIReceived(source, &packetList)
}

FileHandle.standardError.write("midiout: ready (virtual source 'Maus EQ')\n".data(using: .utf8)!)

while let line = readLine(strippingNewline: true) {
    let parts = line.split(separator: " ").compactMap { UInt8($0) }
    if parts.count == 3 {
        sendCC(parts[0], parts[1], parts[2])
    }
}
