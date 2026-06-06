const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceDir = '/Users/mpseidel/Documents/Portfolio Website';
const downloadsDir = path.join(workspaceDir, 'downloads');
const tempDir = path.join(workspaceDir, 'temp_build');

// Helper to ensure clean directories
function setupDirs() {
    if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
    }
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
}

// Write mock JUCE Plugin files
function buildJuceMock() {
    const jucePath = path.join(tempDir, 'AeroSynth_JUCE_Plugin_v1.0.0');
    fs.mkdirSync(jucePath, { recursive: true });
    fs.mkdirSync(path.join(jucePath, 'AeroSynth.vst3'), { recursive: true });
    fs.mkdirSync(path.join(jucePath, 'AeroSynth.component'), { recursive: true });

    const readmeContent = `========================================================================
AeroSynth JUCE Plugin - Version 1.0.0 Demo
========================================================================

Thank you for downloading the AeroSynth JUCE Audio Synthesizer Plugin!
This demo package contains mock binaries to demonstrate installer configuration.

INSTALLATION INSTRUCTIONS:

macOS:
- Copy 'AeroSynth.component' to: /Library/Audio/Plug-Ins/Components/
- Copy 'AeroSynth.vst3' to: /Library/Audio/Plug-Ins/VST3/

Windows:
- Copy 'AeroSynth.vst3' to: C:\\Program Files\\Common Files\\VST3\\

FEATURES:
1. Smooth Sine/Square/Triangle synth oscillator with dual-voice unison.
2. Frosted Aero Glass GUI skin.
3. Resonant lowpass/highpass filter with dynamic resonance control.
4. Integrated oscilloscope visualizer showing real-time wave physics.

Please verify this plugin inside your digital audio workstation (DAW)
like Ableton Live, Logic Pro, or Reaper.

For development support, contact: dev@mpseidel.com
`;

    fs.writeFileSync(path.join(jucePath, 'README.txt'), readmeContent);
    fs.writeFileSync(path.join(jucePath, 'AeroSynth.vst3', 'Contents'), 'Dummy VST3 binary structure');
    fs.writeFileSync(path.join(jucePath, 'AeroSynth.component', 'Contents'), 'Dummy AudioUnit binary structure');
    
    console.log('Synthesized JUCE folder structure.');
}

// Write mock Unity VR MIDI Visualizer files
function buildUnityMock() {
    const unityPath = path.join(tempDir, 'VR_MIDI_Visualizer_Unity_Project');
    fs.mkdirSync(unityPath, { recursive: true });
    fs.mkdirSync(path.join(unityPath, 'Assets', 'Scripts'), { recursive: true });
    fs.mkdirSync(path.join(unityPath, 'ProjectSettings'), { recursive: true });

    const readmeContent = `========================================================================
VR MIDI Visualizer - Unity Project Template (v1.0.0)
========================================================================

Welcome to the VR MIDI Visualizer Unity template!
This repository download contains scripts and settings to configure SteamVR/Meta OpenXR input.

GETTING STARTED:
1. Open Unity Hub and click "Add project from disk".
2. Select this 'VR_MIDI_Visualizer_Unity_Project' folder.
3. Use Unity Editor version 2022.3 LTS or higher.
4. Double click the 'Assets/Scenes/MainVisualizer.unity' scene.
5. Connect a USB MIDI Keyboard to your PC/Mac.
6. Press Play! Notes will spawn floating aesthetic glass spheres and ripple effects in VR.

SCRIPTS INCLUDED:
- Assets/Scripts/MidiInputHandler.cs : Subscribes to MIDI inputs and translates pitches to positions.
- Assets/Scripts/AeroBubbleSpawner.cs : Controls particle size, glossy shaders, and speed parameters.

Requires: XR Interaction Toolkit, OpenXR Plugin.
`;

    const csharpScript = `using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.InputSystem;

public class MidiInputHandler : MonoBehaviour
{
    public GameObject bubblePrefab;
    public float spawnRadius = 5.0f;
    public Gradient pitchColors;

    void Start()
    {
        Debug.Log("Initializing Frutiger Aero MIDI Input Handler...");
        // Listen to active MIDI keyboards
        InputSystem.onDeviceChange += OnDeviceChange;
    }

    private void OnDeviceChange(InputDevice device, InputDeviceChange change)
    {
        if (device is MinidspMidiDevice || device.description.interfaceName == "MIDI")
        {
            Debug.Log("MIDI controller connected: " + device.displayName);
        }
    }

    public void TriggerNoteOn(int noteNumber, float velocity)
    {
        float angle = (noteNumber % 12) * 30.0f * Mathf.Deg2Rad;
        Vector3 spawnPos = new Vector3(Mathf.Cos(angle) * spawnRadius, noteNumber / 12.0f, Mathf.Sin(angle) * spawnRadius);
        
        GameObject bubble = Instantiate(bubblePrefab, spawnPos, Quaternion.identity);
        var bubbleRenderer = bubble.GetComponent<Renderer>();
        if (bubbleRenderer != null)
        {
            Color noteColor = pitchColors.Evaluate((noteNumber % 24) / 24.0f);
            bubbleRenderer.material.SetColor("_BaseColor", noteColor);
            bubbleRenderer.material.SetFloat("_Glossiness", 0.95f);
        }
        
        Destroy(bubble, 6.0f);
    }
}
`;

    fs.writeFileSync(path.join(unityPath, 'README.txt'), readmeContent);
    fs.writeFileSync(path.join(unityPath, 'Assets', 'Scripts', 'MidiInputHandler.cs'), csharpScript);
    fs.writeFileSync(path.join(unityPath, 'ProjectSettings', 'ProjectVersion.txt'), 'm_EditorVersion: 2022.3.20f1\nm_EditorVersionWithRevision: 2022.3.20f1 (23a54b3dfd1a)');

    console.log('Synthesized Unity Project folder structure.');
}

// Compress folders into ZIP packages using shell zip command
function compress() {
    try {
        console.log('Compiling ZIP archives using system command...');
        
        // Compress JUCE plugin
        const juceZip = path.join(downloadsDir, 'JUCE_Plugin_v1.0.0_Demo.zip');
        execSync(`zip -r "${juceZip}" AeroSynth_JUCE_Plugin_v1.0.0`, { cwd: tempDir, stdio: 'inherit' });
        
        // Compress Unity project
        const unityZip = path.join(downloadsDir, 'VR_MIDI_Visualizer_Unity.zip');
        execSync(`zip -r "${unityZip}" VR_MIDI_Visualizer_Unity_Project`, { cwd: tempDir, stdio: 'inherit' });

        console.log('Successfully created ZIP files inside downloads/ folder:');
        console.log(' - ' + juceZip);
        console.log(' - ' + unityZip);
    } catch (err) {
        console.error('Error compiling ZIP files:', err.message);
        process.exit(1);
    }
}

// Clean up temp directories
function cleanup() {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
        console.log('Cleaned up temporary directories.');
    }
}

// Main sequence
function main() {
    setupDirs();
    buildJuceMock();
    buildUnityMock();
    compress();
    cleanup();
    console.log('Mock asset build finished successfully!');
}

main();
