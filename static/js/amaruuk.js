const Amaruuk = {
  elEye: null,
  elBubble: null,
  elSmall: null,
  init: () => {
    Amaruuk.elEye = document.getElementById("Amaruuk_eye")
    Amaruuk.elEye.classList.add('-shown')
    Amaruuk.elEye.addEventListener("animationend", Amaruuk.blinkEnd)
    Amaruuk.blink()
    Amaruuk.elBubble = document.getElementById("LeftMenu_SmallAmaruuk_bubble")
    Amaruuk.elSmall = document.getElementById("LeftMenu_SmallAmaruuk")
  },
  blinkEnd: () => {
    Amaruuk.elEye.style.animationName = ''
    Amaruuk.elEye.style.animationDuration = ''
    Amaruuk.blink()
  },
  blink: () => {
    window.setTimeout(() => {
      Amaruuk.elEye.style.animationDuration = 300+Math.floor(Math.random()*300)+'ms';
      Amaruuk.elEye.style.animationName = 'blinkEye'
    }, 1000+Math.floor(Math.random()*8000))
  },
  say: content => {
    if (content == '') {
      Amaruuk.elSmall.classList.remove('-squawk')
    } else {
      Amaruuk.elBubble.innerHTML = content
      Amaruuk.elSmall.classList.add('-squawk')
    }
  }
}

window.addEventListener('DOMContentLoaded', Amaruuk.init)