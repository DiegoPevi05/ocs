import re

path = '/home/fares00/documents/projects/ocs/ocs-web/src/pages/EditorPage.tsx'
with open(path, 'r') as f:
    code = f.read()

# Update trains state to include trackIndex
code = code.replace("cameraMode: 'free' | 'chase' | 'side' | 'front' }[]>([]);", "cameraMode: 'free' | 'chase' | 'side' | 'front', trackIndex: number }[]>([]);")

# Update Add Train button
code = code.replace("cameraMode: 'free' }]);", "cameraMode: 'free', trackIndex: 0 }]);")

# Add a Track selector in the Train card
track_select = """
              <div style={{ marginTop: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Track:</span>
                <select 
                  value={train.trackIndex}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    setTrains(prev => prev.map(t => t.id === train.id ? { ...t, trackIndex: idx } : t));
                    engineRef.current?.updateTrain(train.id, { trackIndex: idx });
                  }}
                  style={{ background: '#334155', color: 'white', border: 'none', borderRadius: 4, padding: '2px 4px', fontSize: '0.7rem' }}
                >
                  {sceneData?.completedTracks?.map((_, idx) => (
                    <option key={idx} value={idx}>Track {idx + 1}</option>
                  )) || <option value={0}>Track 1</option>}
                </select>
              </div>"""

if "Track:" not in code:
    code = code.replace("""<div style={{ marginTop: 8, display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Cam:</span>""", track_select + """
              <div style={{ marginTop: 4, display: 'flex', gap: 4, alignItems: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Cam:</span>""")


# Also check how setSimState('stopped') works in EditorPage
# When top bar "Stop Simulation" is clicked, we need to completely clear trains or let ViewerEngine handle it. ViewerEngine handles it now.

with open(path, 'w') as f:
    f.write(code)

print("done")
