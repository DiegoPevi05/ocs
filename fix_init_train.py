import re

path = '/home/fares00/documents/projects/ocs/ocs-web/src/pages/EditorPage.tsx'
with open(path, 'r') as f:
    code = f.read()

code = code.replace("setTimeout(() => engineRef.current?.addTrain(id), 50);", "setTimeout(() => { engineRef.current?.addTrain(id); engineRef.current?.updateTrain(id, { isPlaying: false }); }, 50);")

with open(path, 'w') as f:
    f.write(code)

print("done")
