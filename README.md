# yzdisk-web

Frontend of yzdisk, an open cloud storage.

## Interface

### Selector

Open window or use iframe with the url `https://s.yzzx.org/disk/#/@?select=1`

with the following config
- `select=1`: select one file
- `select=multiple`: select multiple files

```js
window.onmessage = e => {
  // check origin for security
  if (e.origin !== 'https://s.yzzx.org') return
  console.log(e.data)
  // [{ _id: 'node id', name: 'file name', type: 'file type' }]
}
```

### Card

Use `<iframe>` to open the url `https://s.yzzx.org/disk/#/card/id1,id2...?token=[token]`
