const dotSize = 3
const dotColor = "#00ff00"
const action_url = "https://www.mturk.com/mturk/externalSubmit"
const sandbox_action_url = "https://workersandbox.mturk.com/mturk/externalSubmit"
const default_img_url = "https://www.dropbox.com/s/fi0tyk3hxcwcykh/1.jpg?dl=1"

var imageObj = new Image()
var zoom = 1
var scale = 1
var sandbox = document.referrer.indexOf('workersandbox') != -1
var dots = []
var assignmentId = undefined
var imgUrl = undefined

function getParameterByName(name, url) {
    if (!url) url = window.location.href
    name = name.replace(/[\[\]]/g, "\\$&")
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)")
    results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, " "))
}

window.onload = function() {
  if (assignmentId == null) assignmentId = getParameterByName("assignmentId")
  if (assignmentId != null && window.location.href.startsWith("http://localhost:9990/")) getLocalData() //review mode
  else {
    imgUrl = getParameterByName("url")
    loadImage(imgUrl == undefined ? default_img_url : imgUrl)
  }
  
  //Event handlers
  document.getElementById('myCanvas').onmousedown = function(e){
    var x = Math.round((e.clientX-e.target.offsetLeft)/(zoom*scale))
    var y = Math.round((e.clientY-e.target.offsetTop)/(zoom*scale))
    dots.push({x: x,y: y})
    redraw()
    checkAssignmetId()
  }

  document.getElementById('btn-zoom-in').onclick = zoomIn
  document.getElementById('btn-zoom-out').onclick = zoomOut
  document.getElementById('btn-undo').onclick = undo
  document.getElementById('btn-submit').onclick = submit
  
  //key shortcuts
  window.onkeypress=function(e){
    if(e.key=="=") zoomIn()
    else if(e.key=="-") zoomOut()
    else if(e.key=="d") toggleDebug()
  }
  
  //loading...
  var canvas = document.getElementById("myCanvas")
  var ctx = canvas.getContext("2d")
  ctx.font = "30px Arial"
  ctx.fillStyle = "grey"
  ctx.textAlign = "center"
  ctx.fillText("Loading...", canvas.width/2, canvas.height/2)

  //debug
  document.getElementById('debug_assignment_id').innerHTML = assignmentId
}

window.onresize = function() {
  redraw()
}

function resizeCanvas() {
    var canvas = document.getElementById("myCanvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerWidth

}

function loadImage(url) {
  imageObj.src = url
  imageObj.onload = redraw
}

function redraw() {
  var canvas = document.getElementById('myCanvas')
  var ctx = canvas.getContext('2d')
  canvas.width = (window.innerWidth - 30) * zoom
  scale = (canvas.width/zoom) / imageObj.width
  canvas.height = imageObj.height * scale * zoom
  ctx.drawImage(imageObj, 0, 0, width=canvas.width, height=canvas.height)
  for(i in dots) {
    drawDot(ctx, dots[i].x, dots[i].y)
  }

  document.getElementById('btn-count').innerHTML = "Count: " + dots.length
  document.getElementById('btn-zoom').innerHTML = zoom * 100 +"%"

  //debug
  document.getElementById('debug_json_textbox').value = JSON.stringify(dots)
}

function zoomIn() {
  if(zoom<8) zoom*=2
  redraw()
}

function zoomOut() {
  if(zoom>1/8) zoom/=2
  redraw()
}

function drawDot(ctx, x, y) {
  ctx.beginPath()
  ctx.arc(x*scale*zoom, y*scale*zoom, dotSize*scale*zoom, 0, 2*Math.PI)
  ctx.fillStyle = dotColor
  ctx.fill()
}

function undo() {
  dots.pop()
  redraw()
}

function submit() {
  if(!checkAssignmetId()) return
  if(dots.length <= 0) {
    alert("Dense crowd counting: Please click on ALL people heads before submit!")
    retrun
  }
  document.getElementById('assignmentId').value = assignmentId
  document.getElementById('dots_data').value = getParameterByName('assignmentId')
  document.getElementById('dots_count').value = dots.length.toString()
  document.getElementById('dots_data').value = JSON.stringify(dots)
  document.getElementById('mt_comments').value = document.getElementById('mt_comments_textbox').value

  var form = document.getElementById("mturk_form")
  form.action = sandbox ? sandbox_action_url : action_url
  form.submit()
}

function checkAssignmetId() {
  if (assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
    alert("You must ACCEPT the HIT before you can submit the results.")
    return false
  }
  return true
}

function getLocalData() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', 'http://localhost:9990/rest/review/' + assignmentId);
  xhr.onload = function() {
      if (xhr.status === 200) {
          var resp = JSON.parse(xhr.responseText)
          dots = JSON.parse(resp["Answer.dots_data"])
          imgUrl = resp["annotation"]
          loadImage(imgUrl)
      }
      else {
          alert('Request failed.  Returned status of ' + xhr.status);
      }
  }
  xhr.send();
}

function toggleDebug() {
  document.getElementById('debug').style = ""
}