(function() {
	var timeouts = []
	var messageName = 'zero-timeout-message'

	function setZeroTimeout (fn) {
		timeouts.push(fn)
		window.postMessage(messageName, '*')
	}

	function handleMessage(event) {
		if (event.source == window && event.data == messageName) {
			event.stopPropagation()
			if (timeouts.length > 0) {
				var fn = timeouts.shift()
				fn()
			}
		}
	}

	window.addEventListener('message', handleMessage, true)

	window.setZeroTimeout = setZeroTimeout
})()

var Neuvol, FPS = 60, maxScore = 0, images = null, ctx = null, score = 0, alivePlayerCarNumber = 0, generation = 1

var speed = function(fps){
	FPS = parseInt(fps, 10)
}

function random () {
  return Math.random() > 0.5
}

var loadImages = function (sources, callback) {
	var num = 0, loaded = 0, imgs = {}
  
  sources.map(function (url, i) {
    num++
    imgs[i] = new Image()
    imgs[i].src = url
    imgs[i].addEventListener('load', function () {
      loaded++
      if(loaded === num) {
        callback(imgs)
      }
    })
  })
}

var Car = (function () {
  var playerCarData = [],
    otherCarData = createOtherCars(),
    carHeight = 72,
    carImage = null,
    playerCars = null,
    interval = 3
  
  function setCarImage () {
    var canvas1 = document.createElement('canvas'),
      ctx1 = canvas1.getContext('2d'),
      canvas2 = document.createElement('canvas'),
      ctx2 = canvas2.getContext('2d'),
      canvas3 = document.createElement('canvas'),
      ctx3 = canvas3.getContext('2d')
    
    canvas1.width = 50
    canvas1.height = 72
    canvas2.width = 50
    canvas2.height = 72
    canvas3.width = 50
    canvas3.height = 72
    
    ctx1.drawImage(images[0], 0, 0, 49, 72, 0, 0, 50, 72)
    ctx2.drawImage(images[0], 49, 0, 49, 72, 0, 0, 50, 72)
    ctx3.drawImage(images[0], 102, 0, 50, 72, 0, 0, 50, 72)
    
    carImage = {
      '0': canvas1,
      '1': canvas2,
      '2': canvas3
    }
  }
  
  function createOtherCars () {
    var len = 3, result = [], x = 0
    
    for (var i = 1; i <= len; i++) {
      x = 100 + Math.random() * 300
      x = Math.min(x, 364)
      
      result.push({
        type: random() ? 1 : 0,
        x: x,
        y: -256 * i,
        width: 36,
        height: 72
      })
    }
    
    return result
  }
  
  // 每 3 次进行一次瞄准
  function getAliveCarX () {
    if (interval === 0) {
      // interval = 3
      interval = 1    
      for (var i = 0; i < playerCarData.length; i++) {
        if (playerCarData[i].alive) {
          return playerCarData[i].x
        }
      }
      
    } else {
      interval--
    }
  }
  
  function addOtherCar () {
    var x = getAliveCarX() || (100 + Math.random() * 264)
    otherCarData.push({
      type: random() ? 1 : 0,
      x: x,
      y: -256,
      width: 36,
      height: 72
    }) 
  }
  
  function createPlayerCars () {
    playerCars = Neuvol.nextGeneration()
    
    for (var i in playerCars) {
      playerCarData.push({
        type: 2,
        x: 232,
        y: 400,
        width: 36,
        height: 72,
        alive: true,
        activeTime: 0
      })
      
      alivePlayerCarNumber++
    }
  }
  
  function removePlayerCar (i) {
    playerCarData.splice(i, 1)
  }
  
  function checkPlayerCarDeadWithOtherCar (x, y) {
    var result = false, otherCar = null
    
    for (var i = 0; i < otherCarData.length; i++) {
      otherCar = otherCarData[i]
      if (!((x > otherCar.x + 36) || (x + 36 < otherCar.x) || (y > otherCar.y + 72) || (y + 72 < otherCar.y))) {
        result = true
        break
      }
    }
    
    return result
  }
  
  function getFirstAndSecondOtherCar () {
    var i = 0
    
    for (i; i < otherCarData.length; i++) {
      if (otherCarData[i].y < 472) {
        break
      }
    }
    
    return [otherCarData[i], otherCarData[i + 1]]
  }
  
  function update () {
    var i = 0, car = null, input = [], result = 0, network = null, max = 0, otherCars = getFirstAndSecondOtherCar()
    
    // update player cars
    for (i = 0; i < playerCarData.length; i++) {
      car = playerCarData[i]
      network = playerCars[i]

      if (car.alive) {
        if (car.x < 100 || car.x > 364 || checkPlayerCarDeadWithOtherCar(car.x, car.y)) {
          car.alive = false
          Neuvol.networkScore(network, car.activeTime === 0 ? 0 : (score + car.activeTime * 1000) )
          alivePlayerCarNumber--
        } else {
          input = [
            car.x / 512,
            otherCars[0].x / 512,
            otherCars[1].x / 512
          ]
          result = playerCars[i].compute(input)
          
          //2 output
          if (result[0] > 0.5) {
            car.activeTime++
            if (result[1] > 0.5) {
              car.x += 8
            } else {
              car.x -= 8
            }
          }
          
          // 1 output
          // if (result[0] <= 0.333333) {
            // car.activeTime++
            // car.x += 8
          // } else if (result[0] >= 0.666666) {
            // car.activeTime++
            // car.x -= 8
          // }
        }
      }
    }
    
    // update other cars
    for (i = 0; i < otherCarData.length; i++) {
      car = otherCarData[i]
      
      if (car.y >= 512) {
        otherCarData.splice(i, 1)
        addOtherCar()
        continue
      } else {
        car.y += 4
      }
    }
  }
  
  function draw () {
    var arr = otherCarData.concat(playerCarData)
    
    arr.map(function (car) {
      if (car.type !== 2 || car.alive) {
        ctx.drawImage(carImage[car.type], car.x, car.y)
      }
    })
  }
  
  function reset () {
    playerCarData = []
    otherCarData = createOtherCars()
    createPlayerCars()
  }
  
  return {
    setCarImage,
    update,
    reset,
    draw,
    createPlayerCars
  }
})();

var Road = (function () {
  var width = 300,
    height = 512,
    y = 512,
    side = drawSide(),
    whiteBlock = drawWhiteBlock(),
    roadStyle = drawRoadStyle()
    
  function drawSide () {
    var canvas1 = document.createElement('canvas'),
      ctx1 = canvas1.getContext('2d')
    
    canvas1.width = 5
    canvas1.height = 64
    
    var lingrad = ctx1.createLinearGradient(0, 0, 0, 64)
    lingrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    lingrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)')
    lingrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)')
    lingrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx1.fillStyle = lingrad
    ctx1.fillRect(0, 0 , 5, 64)
    
    var canvas2 = document.createElement('canvas'),
      ctx2 = canvas2.getContext('2d')
    
    canvas2.width = 5
    canvas2.height = 512 * 2
    
    var ptrn = ctx2.createPattern(canvas1, 'repeat')
    ctx2.fillStyle = ptrn
    ctx2.fillRect(0, 0, 5, 512 * 2)
    
    return canvas2
  }
  
  function drawWhiteBlock () {
    var canvas1 = document.createElement('canvas'),
      ctx1 = canvas1.getContext('2d')
    
    canvas1.width = 10
    canvas1.height = 128
    
    var lingrad = ctx1.createLinearGradient(0, 0, 0, 128)
    lingrad.addColorStop(0, 'rgba(255, 255, 255, 1)')
    lingrad.addColorStop(0.5, 'rgba(255, 255, 255, 1)')
    lingrad.addColorStop(0.5, 'rgba(255, 255, 255, 0)')
    lingrad.addColorStop(1, 'rgba(255, 255, 255, 0)')
    
    ctx1.fillStyle = lingrad
    ctx1.fillRect(0, 0 , 10, 128)
    
    var canvas2 = document.createElement('canvas'),
      ctx2 = canvas2.getContext('2d')
    
    canvas2.width = 10
    canvas2.height = 512 * 2
    
    var ptrn = ctx2.createPattern(canvas1, 'repeat')
    ctx2.fillStyle = ptrn
    ctx2.fillRect(0, 0, 10, 512 * 2)
    
    return canvas2
  }
  
  function drawRoadStyle () {
    var canvas1 = document.createElement('canvas'),
      ctx1 = canvas1.getContext('2d')
    
    canvas1.width = 300 + 10
    canvas1.height = 512 * 2
    
    // left side
    ctx1.drawImage(side, 0, 0, 5, 512 * 2, 0, 0, 5, 512 * 2)
    
    // right side
    ctx1.drawImage(side, 0, 0, 5, 512 * 2, 305, 0, 5, 512 * 2)
    
    // white block
    ctx1.drawImage(whiteBlock, 0, 0, 10, 512 * 2, 150, 0, 10, 512 * 2)
        
    return canvas1
  }
  
  function update () {
    // road style
    y = y <= 0 ? (512) : y
    y = y - 8
  }
  
  function draw () {
    // background
    ctx.fillStyle = '#83d312'
    ctx.fillRect(0, 0, 500, 512)
    
    // road
    ctx.fillStyle = '#757575'
    ctx.fillRect(100, 0, width, height)
    
    ctx.drawImage(roadStyle, 0, y, 310, 512, 95, 0, 310, 512)
  }
  
  function reset () {
    y = 512
  }
  
  return {
    update,
    reset,
    draw
  }
})();

var Borad = (function () {
  
  function draw () {
    ctx.fillStyle = 'white'
    ctx.font = '20px Oswald, sans-serif'
    ctx.fillText('Score : ' + score, 10, 25)
    ctx.fillText('Max Score : ' + maxScore, 10, 50)
    ctx.fillText('Generation : ' + generation, 10, 75)
    ctx.fillText('Alive : ' + alivePlayerCarNumber + ' / ' + Neuvol.options.population, 10, 100)
  }
  
  return {
    draw
  }
})();

var RocketCarGame = (function () {
  
  function run () {
    ctx.clearRect(0, 0, 500, 512)
    
    score++
    maxScore = Math.max(score, maxScore)
    
    if (alivePlayerCarNumber === 0) {
      return restart()
    }
    
    Road.update()
    Car.update()
    Road.draw()
    Car.draw()
    Borad.draw()
    
    if(FPS === 0){
      setZeroTimeout(function () {
        run()
      })
    }else{
      setTimeout(function () {
        run()
      }, 1000 / FPS)
    }
  }
  
  function start () {
    run()
  }
  
  function restart () {
    score = 0
    generation++
    Road.reset()
    Car.reset()
    run()
  }
  
  return {
    start,
    stop
  }
})();

window.addEventListener('load', function () {
  ctx = document.getElementById('canvas').getContext('2d')
  
  var sprites = ['./img/cars.png']

  loadImages(sprites, function(imgs){
		images = imgs
    Car.setCarImage()
    
    Neuvol = new Neuroevolution({
			population: 100,
			network:[3, [3], 2]
		})
    
    Car.createPlayerCars()
		
		RocketCarGame.start()
	})
})
