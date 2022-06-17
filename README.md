# yzdisk-web

Frontend of yzdisk

## Interface

### Selector

Open window or use iframe with the url `https://sa.yzzx.org/disk/#/@?select=1`

with the following config
- `select=1`: select one file
- `select=multiple`: select multiple files

```js
window.onmessage = e => {
  // check origin for security
  if (e.origin !== 'https://sa.yzzx.org') return
  console.log(e.data)
  // [{ _id: 'node id', name: 'file name', type: 'file type' }]
}
```
