const Nav = {
  isTraveling: false,
  convertAnchors: () => {
    let anchors = document.body.getElementsByTagName('a')
    anchors = Array.prototype.filter.call(anchors, anchor => {
      return (anchor.hostname == location.hostname) && (anchor.pathname.startsWith("/gallery") || anchor.pathname == "/")
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
      document.title = path.substr("/gallery/".length) + " - BirdTooth Studio"
      Nav.clearContent()
      while (content.firstChild) document.getElementById('Content').appendChild(content.firstChild)
      Nav.setupGallery()
    })
  },
  clearContent: () => {
    let content = document.getElementById('Content')
    while (content.firstChild) content.firstChild.remove()
  },
  setupGallery: () => {
    let gallery = document.getElementById('Gallery')
    if (!gallery) return
    Array.prototype.forEach.call(gallery.children, item => {
      if (item.hasAttribute('x-title')) {
        item.addEventListener('mouseover', e => {
          Amaruuk.say(`<header>${item.getAttribute('x-title')}</header>${item.getAttribute('x-year')}<p>${item.getAttribute('x-description')}</p>`)
        })
        item.addEventListener('mouseout', e => {
          Amaruuk.say('')
        })
        item.addEventListener('click', () => {
          Nav.displayLightbox(item.getElementsByClassName('Gallery_item_image')[0])
        })
      }
    })
  },
  setupLightbox: () => {
    document.getElementById('Lightbox_close').addEventListener('click', () => {
      Nav.displayLightbox('')
    })
    document.getElementById('Lightbox_left').addEventListener('click', () => {
      try {
        Nav.displayLightbox(Nav.currentTarget.parentNode.parentNode.previousElementSibling.getElementsByClassName('Gallery_item_image')[0])
      } catch(e) {}
    })
    document.getElementById('Lightbox_right').addEventListener('click', () => {
      try {
        Nav.displayLightbox(Nav.currentTarget.parentNode.parentNode.nextElementSibling.getElementsByClassName('Gallery_item_image')[0])
      } catch(e) {}
    })
    window.addEventListener('keyup', (e) => {
      if (e.key == "Escape") {
        Nav.displayLightbox('')
      } else if (e.key == "ArrowLeft" || e.key == "h") {
        try { 
          Nav.displayLightbox(Nav.currentTarget.parentNode.parentNode.previousElementSibling.getElementsByClassName('Gallery_item_image')[0])
        } catch(e) {}
      } else if (e.key == "ArrowRight" || e.key == "l") {
        try { 
          Nav.displayLightbox(Nav.currentTarget.parentNode.parentNode.nextElementSibling.getElementsByClassName('Gallery_item_image')[0])
        } catch(e) {}
      }
    })
  },
  displayLightbox: (target) => {
    Nav.currentTarget = target
    let lightbox = document.getElementById('Lightbox')
    if (!target) {
      lightbox.classList.remove('-shown')
      lightbox.classList.add('-hidden')
      document.getElementById('Lightbox_video').pause()
      return
    }
    lightbox.classList.remove('-hidden')
    lightbox.classList.add('-shown')
    if (target.tagName === 'IMG') {
      document.getElementById('Lightbox_video').pause()
      document.getElementById('Lightbox_img').src = target.getAttribute('x-src')
      document.getElementById('Lightbox_img').style.display = 'block'
      document.getElementById('Lightbox_video').style.display = 'none'
    } else if (target.tagName === 'VIDEO') {
      if (target.controls) {
        document.getElementById('Lightbox_video').setAttribute('controls', '')
      } else {
        document.getElementById('Lightbox_video').removeAttribute('controls')
      }
      if (target.autoplay) {
        document.getElementById('Lightbox_video').setAttribute('autoplay', '')
      } else {
        document.getElementById('Lightbox_video').removeAttribute('autoplay')
      }
      if (target.muted) {
        document.getElementById('Lightbox_video').setAttribute('muted', '')
      } else {
        document.getElementById('Lightbox_video').removeAttribute('muted')
      }
      document.getElementById('Lightbox_video').src = target.src
      document.getElementById('Lightbox_video').style.display = 'block'
      document.getElementById('Lightbox_img').style.display = 'none'
    }
    document.getElementById('Lightbox_title').innerHTML = Nav.currentTarget.parentNode.parentNode.getAttribute('x-title')
    // Show/hide left/right nav arrows 
    if (Nav.currentTarget.parentNode.parentNode.previousElementSibling) {
      document.getElementById('Lightbox_left').style.opacity = 1
    } else {
      document.getElementById('Lightbox_left').style.opacity = 0
    }
    if (Nav.currentTarget.parentNode.parentNode.nextElementSibling) {
      document.getElementById('Lightbox_right').style.opacity = 1
    } else {
      document.getElementById('Lightbox_right').style.opacity = 0
    }
  }
}
window.addEventListener('popstate', Nav.handleHistoryPop)
window.history.replaceState({
  path: document.location.pathname == "/" ? "/splash" : document.location.pathname,
}, "", document.location.pathname)

window.addEventListener('DOMContentLoaded', () => {
  Nav.convertAnchors()
  Nav.setupGallery()
  Nav.setupLightbox()
  if (Nav.inGallery()) {
    document.title = window.location.pathname.substr("/gallery/".length) + " - BirdTooth Studio"
  }
})
