const fs = require('fs')

fs.readdir('Paleo Portraits', (err, items) => {
  let objs = []
  for (let i = 0; i < items.length; i++) {
    let num = Number(items[i].split('-')[0])
    let year = num <= 21 ? 2014 : 2015
    let name = items[i].split('-')[1]
    name = name.substring(0,name.length-4)
    let tags = ["Digital", "Illustration", "PaleoPortrait"]
    let desc = "A series portraying myriad prehistoric species in a unifying format"
    let title = "Paleo Portraits: " + name
    objs.push({
      Title: title,
      Description: desc,
      File: "Paleo Portraits/"+items[i],
      Tags: tags,
      Year: String(year),
    })
  }
  objs.forEach(item => {
    console.log(JSON.stringify(item, null, 2)+',')
  })
})
