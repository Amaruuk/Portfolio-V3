const Nav = {
  isTraveling: false,
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
            Nav.request(anchor.pathname, result => {
              if (result) {
                window.history.pushState({
                  path: anchor.pathname,
                }, "", anchor.pathname)
                Nav.setContent(anchor.pathname, result)
              } else {
                console.log("bad request!")
              }
            }, true)
          })
        } else if (anchor.pathname == "/") {
          Nav.travelToSplash(() => {
            Nav.request("/splash", result => {
              if (result) {
                window.history.pushState({
                  path: "/splash",
                }, "", "/splash")
              } else {
                console.log("bad request")
              }
            }, true)
          })
        } else {
          window.location.assign(anchor.href)
        }
      })
    }
  },
  inGallery: () => {
    return document.body.id == 'GalleryView'
  },
  inSplash: () => {
    return document.body.id == 'SplashView'
  },
  waitForAnimationEnd: (queries, animations, cb) => {
    let done = 0
    queries.forEach((query, index) => {
      let el = document.querySelector(query)

      if (!el) {
        if (checkDone()) return
      }

      function elEndFunc() {
        el.removeEventListener("animationend", elEndFunc)
        checkDone()
      }

      function checkDone() {
        if (++done == queries.length) {
          cb(removeAnimations)
          return true
        }
        return false
      }

      function removeAnimations() {
        queries.forEach(query => {
          document.querySelector(query).style.setProperty('animation-name', '')
        })
      }

      el.addEventListener("animationend", elEndFunc)
      el.style.setProperty('animation-name', animations[index])
    })
  },
  travelToGallery: cb => {
    if (Nav.isTraveling) return
    if (Nav.inGallery()) {
      return cb()
    } else {
      isTraveling = true
      Nav.waitForAnimationEnd(["#Amaruuk", "#LeftMenu_navigation"], ["fadeOut", "fadeOut"], (r1) => {
        document.querySelector('#Amaruuk').style.display = 'none'
        document.querySelector('#LeftMenu_navigation').style.visibility = 'hidden'
        Nav.waitForAnimationEnd(["#LeftMenu", "#Banner", "#Banner_title"], ["shrinkLeftMenu", "moveBannerUp", "moveBannerTitleRight"], (r2) => {
          r1()
          document.querySelector('#LeftMenu_navigation').style.visibility = 'visible'
          document.body.id = "GalleryView"
          Nav.waitForAnimationEnd(["#LeftMenu_navigation", "#Banner_navigation"], ["fadeIn", "fadeIn"], (r3) => {
            r2()
            r3()
            isTraveling = false
            return cb()
          })
        })
      })
    }
  },
  travelToSplash: cb => {
    if (Nav.isTraveling) return
    if (Nav.inSplash()) {
      return cb()
    } else {
      isTraveling = true
      Nav.waitForAnimationEnd(["#Banner_navigation", "#LeftMenu_navigation", "#LeftMenu_SmallAmaruuk", "#Content"], ["fadeOut", "fadeOut", "fadeOut", "fadeOut"], (r1) => {
        Nav.waitForAnimationEnd(["#LeftMenu", "#Banner", "#Banner_title"], ["growLeftMenu", "moveBannerDown", "moveBannerTitleLeft"], (r2) => {
          document.querySelector('#Amaruuk').style.display = ''
          document.body.id = "SplashView"
          Nav.waitForAnimationEnd(["#Amaruuk", "#LeftMenu_navigation"], ["fadeIn", "fadeIn"], (r3) => {
            r1()
            r2()
            r3()
            isTraveling = false
            return cb()
          })
        })
      })
    }
  },
  request: (path, cb) => {
    let xhr = new XMLHttpRequest()
    xhr.addEventListener('readystatechange', () => {
      if (xhr.readyState == 4) {
        if (xhr.responseXML && xhr.responseXML.body) {
          cb(xhr.responseXML.body)
        } else {
          cb(null)
        }
      }
    })
    xhr.addEventListener('error', () => {
      cb(false)
    })
    xhr.open('GET', '/api'+path)
    xhr.responseType = 'document'
    xhr.send()
  },
  handleHistoryPop: event => {
    if (event.state.path == "/splash") {
      Nav.travelToSplash(()=>{
        Nav.clearContent()
      })
    } else {
      Nav.request(event.state.path, (content) => {
        if (content) {
          Nav.setContent(event.state.path, content)
        }
      })
    }
  },
  setContent: (path, content) => {
    Nav.travelToGallery(() => {
      Nav.clearContent()
      while (content.firstChild) document.getElementById('Content').appendChild(content.firstChild)
    })
  },
  clearContent: () => {
    let content = document.getElementById('Content')
    while (content.firstChild) content.firstChild.remove()
  },
}
window.addEventListener('popstate', Nav.handleHistoryPop)
window.history.replaceState({
  path: document.location.pathname == "/" ? "/splash" : document.location.pathname,
}, "", document.location.pathname)

window.addEventListener('DOMContentLoaded', () => {
  Nav.convertAnchors()
})