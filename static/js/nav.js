const Nav = {
  convertAnchors: () => {
    let anchors = document.body.getElementsByTagName('a')
    anchors = Array.prototype.filter.call(anchors, anchor => {
      return anchor.pathname.startsWith("/gallery") || anchor.pathname == "/"
    })

    for (let anchor of anchors) {
      anchor.addEventListener('click', e => {
        e.preventDefault()

        console.log("ding")
        if (anchor.pathname.startsWith("/gallery")) {
          Nav.travelToGallery(() => {
            window.history.pushState({}, "", anchor.pathname)
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
  waitForAnimationEnd: (queries, animations, cb) => {
    let done = 0
    queries.forEach((query, index) => {
      let el = document.querySelector(query)

      if (!el) {
        if (checkDone()) return
      }

      function checkDone() {
        if (++done == queries.length) {
          queries.forEach(query => {
            document.querySelector(query).style.setProperty('animation-name', '')
          })
          cb()
          return true
        }
        return false
      }

      function elEndFunc() {
        el.removeEventListener("animationend", elEndFunc)
        checkDone()
      }

      el.addEventListener("animationend", elEndFunc)
      el.style.setProperty('animation-name', animations[index])
    })
  },
  travelToGallery: cb => {
    if (Nav.inGallery()) {
      return cb()
    } else {
      Nav.waitForAnimationEnd(["#Amaruuk", "#LeftMenu_navigation"], ["fadeOut", "fadeOut"], () => {
        document.querySelector('#Amaruuk').style.display = 'none'
        document.querySelector('#LeftMenu_navigation').style.visibility = 'hidden'
        console.log('step 1 done')

        Nav.waitForAnimationEnd(["#Banner", "#Banner_title", "#LeftMenu"], ["moveBannerUp", "moveBannerTitleRight", "shrinkLeftMenu"], () => {
          document.querySelector('#LeftMenu_navigation').style.visibility = 'visible'
          document.body.id = "GalleryView"

          return cb()
        })
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