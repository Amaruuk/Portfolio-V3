const Nav = {
  convertAnchors: () => {
    let anchors = document.body.getElementsByTagName('a')
    anchors = Array.prototype.filter.call(anchors, anchor => {
      return anchor.pathname.startsWith("/gallery") || anchor.pathname == "/"
    })

    for (let anchor of anchors) {
      anchor.addEventListener('click', e => {
        e.preventDefault()

        if (anchor.pathname.startsWith("/gallery")) {
          Nav.travelToGallery(() => {
            console.log("should show gallery")
          })
        } else if (anchor.pathname == "/") {
          Nav.travelToSplash(() => {
            console.log("should show splash?")
          })
        } else {
          window.location.assign(anchor.href)
        }
      })
    }
  },
  inGallery: () => {
    return window.location.pathname.startsWith("/gallery")
  },
  inSplash: () => {
    return window.location.pathname == "/"
  },
  waitForAnimationEnd: (ids, animations, cb) => {
    let done = 0
    ids.forEach((id, index) => {
      let el = document.getElementById(id)
      function elEndFunc() {
        el.removeEventListener("animationend", elEndFunc)
        el.style.animationName = ""
        if (++done == ids.length) {
          cb()
        }
      }
      el.addEventListener("animationend", elEndFunc)
      el.style.animationName = animations[index]
    })
  },
  travelToGallery: cb => {
    if (Nav.inGallery()) {
      return cb()
    } else {
      console.log("waiting!")
      Nav.waitForAnimationEnd(["Amaruuk", "LeftMenu"], ["fadeOut", "fadeOut"], () => {
        document.body.id = "GalleryView"
        console.log("anim dun dun")
        return cb()
      })
    }
  },
  travelToSplash: cb => {
    if (Nav.inSplash()) {
      return cb()
    } else {
      // Start transition, yo
      return cb()
    }
  },
  request: (path, cb) => {
    let xhr = new XMLHttpRequest()
    let done = false
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState == 4) {
        cb(xhr.responseXML.body)
      }
    })
    xhr.addEventListener('error', () => {
      cb(false)
    })
    xhr.open('GET', '/api'+path)
    xhr.responseType = 'document'
    xhr.send()
  }
}

window.addEventListener('DOMContentLoaded', () => {
  Nav.convertAnchors()
})