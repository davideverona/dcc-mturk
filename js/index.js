const dotSize = 4
const dotColor = "#00ff00"

const example_img_url = "https://www.dropbox.com/s/28f7wj1xlv9yn9l/46.jpg?dl=1"

var actionUrl = undefined
var imageObj = undefined
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
  //Parameters
  assignmentId = getParameterByName("assignmentId")
  actionUrl = getParameterByName('sendTo')
  imgUrl = getParameterByName("url")
  loadImage(imgUrl == undefined ? example_img_url : imgUrl)

  //Event handlers
  //onresize
  window.onresize = function() {
    redraw()
  }

  //ononcontextmenu
  document.getElementById('myCanvas').oncontextmenu = function(e){ return false; }

  //onmousedown
  document.getElementById('myCanvas').onmousedown = function(e){
    var x = Math.round((e.pageX-e.target.offsetLeft)/(zoom*scale))
    var y = Math.round((e.pageY-e.target.offsetTop)/(zoom*scale))
    if (e.button == 2) { //secondary click
      //delete
      var d = 5 //delta
      for (i in dots)
        if(dots[i].x > x-d && dots[i].x < x+d && dots[i].y > y-d && dots[i].y < y+d) dots.splice(i, 1)
    } else {
      //add
      dots.push({x: x,y: y})
    }
    redraw()
    checkAssignmetId()
  }

  document.getElementById('btn-zoom-in').onclick = zoomIn
  document.getElementById('btn-zoom-out').onclick = zoomOut
  document.getElementById('btn-undo').onclick = undo
  document.getElementById('btn-submit').onclick = submit

  //document.getElementById('example').onclick = toggleExample

  //key shortcuts
  window.onkeypress=function(e){
    if(e.key=="=") zoomIn()
    else if(e.key=="-") zoomOut()
    else if(e.key=="d") toggleDebug()
  }

  //loading...
  loading()

  //debug
  document.getElementById('debug_assignment_id').innerHTML = assignmentId
}

function resizeCanvas() {
    var canvas = document.getElementById("myCanvas")
    canvas.width = window.innerWidth
    canvas.height = window.innerWidth
}

function loadImage(url) {
  imageObj = new Image()
  imageObj.src = url
  imageObj.onload = function () {
    if (imageObj.width <= 256) zoom = 4
    else zoom = 1
    redraw()
  }
}

function redraw() {
  if (imageObj == undefined) return

  var canvas = document.getElementById('myCanvas')
  var ctx = canvas.getContext('2d')
  canvas.width = (window.innerWidth - 30) * zoom
  scale = (canvas.width/zoom) / imageObj.width
  canvas.height = imageObj.height * scale * zoom

  if (imageObj != undefined) ctx.drawImage(imageObj, 0, 0, width=canvas.width, height=canvas.height)
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
  ctx.arc(x*scale*zoom, y*scale*zoom, dotSize*zoom, 0, 2*Math.PI)
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
  document.getElementById('dots_count').value = dots.length.toString()
  document.getElementById('dots_data').value = JSON.stringify(dots)
  document.getElementById('mt_comments').value = document.getElementById('mt_comments_textbox').value

  var form = document.getElementById("mturk_form")
  form.action = actionUrl
  form.submit()
}

function checkAssignmetId() {
  if (assignmentId == "ASSIGNMENT_ID_NOT_AVAILABLE") {
    alert("You must ACCEPT the HIT before you can submit the results.")
    return false
  }
  return true
}

function toggleDebug() {
  document.getElementById('debug').style = ""
}

function review(row) {
  loading()

  assignmentId = row["assignmentid"]
  dots = JSON.parse(row["Answer.dots_data"])
  imgUrl = row["annotation"]
  document.getElementById("mt_comments").value = row["mt_comments"]
  toggleDebug()
  loadImage(imgUrl)
}

function loading() {
  var canvas = document.getElementById("myCanvas")
  var ctx = canvas.getContext("2d")
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = "30px Arial"
  ctx.fillStyle = "grey"
  ctx.textAlign = "center"
  ctx.fillText("Loading...", canvas.width/2, canvas.height/2)
}

/*function toggleExample() {
  exampleMode = !exampleMode
  if (exampleMode) {
    document.getElementById('example').innerHTML = "example"
  } else {
    document.getElementById('example').innerHTML = "hide example"
  }
  redraw()
}*/
