"use strict";

/* TETRIS 

Правила:
Случайные фигурки тетрамино падают сверху в прямоугольный стакан шириной 10 и высотой 20 клеток. В полёте игрок может поворачивать фигурку на 90° и двигать её по горизонтали. Также можно «сбрасывать» фигурку, то есть ускорять её падение, когда уже решено, куда фигурка должна упасть. Фигурка летит до тех пор, пока не наткнётся на другую фигурку либо на дно стакана. Если при этом заполнился горизонтальный ряд из 10 клеток, он пропадает и всё, что выше него, опускается на одну клетку. Дополнительно показывается фигурка, которая будет следовать после текущей — это подсказка, которая позволяет игроку планировать действия. Темп игры постепенно ускоряется. Игра заканчивается, когда новая фигурка не может поместиться в стакан. Игрок получает очки за каждый заполненный ряд, поэтому его задача — заполнять ряды, не заполняя сам стакан (по вертикали) как можно дольше, чтобы таким образом получить как можно больше очков. 

Фигуры:
7 «кирпичиков-тетрамино» тетриса: I, J, L, O, S, T, Z.

Начисление очков:
1 линия — 100 очков, 
2 линии — 300 очков, 
3 линии — 700 очков, 
4 линии (то есть сделать Тетрис) — 1500 очков

Ускорение игры:
Каждому уровню соответствует своя цветовая палитра и темп.
Переход на следующий уровень происходит после выпадения 25 фигур.

Уровень | Скорость (ячеек/с)
0 	      1.25
1 	      1.40
2 	      1.58
3 	      1.82
4   	    2.15
5         2.61
6 	      3.34
7         4.62
8 	      7.51
9 	      10.02
10–12   	12.02
13–15   	15.05
16–18   	20.03
19–28   	30.05
29+ 	    60.10

*/

function Tetris(params) {
  params = params || {}

  const con = $(params['con']).first()
  
  if (con.length < 1)
    return false

  params['startLevel'] = params['startLevel'] === undefined ? 5 : params['startLevel']

  params['onPrepare'] = params['onPrepare'] || function(cbStart) {
    if (confirm('Начать игру?')) {
      cbStart()
    }
  }

  params['onStopQuestion'] = params['onStopQuestion'] || function(cbStop) {
    if (confirm('Завершить игру?')) {
      cbStop()
    }
  }

  params['onStart'] = params['onStart'] || function() { 
    console.log('START')
  }

  params['onStop'] = params['onStop'] || function(byUser, stat) { 
    console.log('STOP', byUser)
    if (!byUser)
      alert('Игра звершена')       
  }

  params['onPause'] = params['onPause'] || function(on) {
    console.log('PASUE', on)
  }

  params['onStat'] = params['onStat'] || function(stat) {}

  const KEY_ESCAPE = 27
  const KEY_SPACEBAR = 32
  const KEY_ARROW_LEFT = 37
  const KEY_ARROW_UP = 38
  const KEY_ARROW_RIGHT = 39
  const KEY_ARROW_DOWN = 40

  const maxColors = 6
  const emptyColor = -1
  const maxRotations = 4 // 0, 90, 180, 270  
  const cos = [1,0,-1,0]
  const sin = [0,1,0,-1]
  const field = {width:10, height:20}
  const fieldPreview = {width:4, height:3}
  const scorePrice = [100, 300, 700, 1500]  
  const rowsPerLevel = field.height
  const levelToSpeed = [
    1.25, 1.40, 1.58, 1.82, 2.15,
    2.61, 3.34, 4.62, 7.51, 10.02,
    12.02, 12.02, 12.02, // 10-12
    15.05, 15.05, 15.05, // 13-15
    20.03, 20.03, 20.03, // 16-18
    30.05, 30.05, 30.05, 30.05, 30.05,  // 19-28
    30.05, 30.05, 30.05, 30.05, 30.05, 
    60.10 // 29+
  ]
    
  const figureI = {
    code:'I', // палка
    x:[0,1,2,3], // x
    y:[0,0,0,0], // y
    pivot:1, // точка вращения
  }

  const figureJ = {
    code:'J', // угол левый
    x:[1,1,1,0], // x
    y:[0,1,2,2], // y
    pivot:1, // точка вращения
  }

  const figureL = {
    code:'L', // угол правый
    x:[0,0,0,1], // x
    y:[0,1,2,2], // y
    pivot:1, // точка вращения
  }

  const figureO = {
    code:'O', // квадрат
    x:[0,1,0,1], // x
    y:[0,0,1,1], // y
    pivot:-1, // точка вращения (нет)
  }

  const figureS = {
    code:'S', // S-молния
    x:[2,1,1,0], // x
    y:[0,0,1,1], // y
    pivot:1, // точка вращения
  }

  const figureZ = {
    code:'Z', // Z-молния
    x:[0,1,1,2], // x
    y:[0,0,1,1], // y
    pivot:1, // точка вращения
  }

  const figureT = {
    code:'T', // T-шка
    x:[1,0,1,2], // x
    y:[0,1,1,1], // y
    pivot:2, // точка вращения
  }
  
  const infoValues = {}
  const figuresList = [figureI, figureJ, figureL, figureO, figureS, figureZ, figureT]

  var loopTimer = null
  var cellsList = $('')
  var cellsPreviewList = $('')
  
  for(const k in figuresList) {
    const fig = figuresList[k]
    fig.bounds = {
      x:Math.max.apply(null, fig.x), 
      y:Math.max.apply(null, fig.y)      
    }
    fig.bounds.max = Math.max(fig.bounds.x, fig.bounds.y)
  }

  function pad(num, size) {
    num = num.toString()
    while (num.length < size) num = "0" + num
    return num
  }

  function getRandValue(minValue, maxValue) {
    const x = maxValue - minValue
    const y = Math.floor(Math.random() * x + 0.5)
    return y + minValue
  }

  function getCellIndex(x, y) {
    if (x < 0 || y < 0 || x >= field.width || y >= field.height)
      return -1
    return y * field.width + x
  }

  function getPreviewCellIndex(x, y) {
    if (x < 0 || y < 0 || x >= fieldPreview.width || y >= fieldPreview.height)
      return -1
    return y * fieldPreview.width + x
  }

  function clearField(list = null) {
    list = list || cellsList
    list.removeClass('on')
  }

  function clearPreviewField() {
    clearField(cellsPreviewList)
  }

  function figureToView(fig, x, y, rotate) {
    if (!fig) return
    /*
    вращение:
    -----------------
    deg  | cos | sin
      0	    1	   0
      90    0    1
      180	 -1	   0
      270	  0	  -1
    --------------
    x2 = cosβ*x1 − sinβ*y1
    y2 = sinβ*x1 + cosβ*y1
    */
    x = Math.floor(x + 0.5)
    y = Math.floor(y + 0.5)
    rotate = (fig.pivot < 0) ? 0 : (rotate % maxRotations)    
    const pivot = Math.max(fig.pivot, 0)    
    const maxVerts = fig.x.length, ox = [], oy = []    
    const px = fig.x[pivot], py = fig.y[pivot]
    const cosa = cos[rotate]
    const sina = sin[rotate]
    var vx, vy, tx, ty
    for(var i=0; i < maxVerts; i++) {      
      vx = fig.x[i] - px
      vy = fig.y[i] - py
      tx = (cosa*vx - sina*vy) + px + x
      ty = (sina*vx + cosa*vy) + py + y
      ox.push(tx)
      oy.push(ty)
    }
    return {x:ox, y:oy}
  }

  function drawRandom(list = null) {
    var clr = 0
    list = list || cellsList
    list.each(function() {
      var e = $(this)
      e.attr('data-color', clr)        
      e.addClass('on')
      //clr = (clr + 1) % maxColors
      clr = getRandValue(0, maxColors - 1)
    })
  }

  function drawFigure(fig, clr) {    
    clr = clr % maxColors    
    const maxVerts = fig.x.length
    for(var i=0; i < maxVerts; i++) {      
      var idx = getCellIndex(fig.x[i], fig.y[i])
      if (idx >= 0 && idx < cellsList.length) {
        var e = $(cellsList[idx])
        e.attr('data-color', clr)        
        e.addClass('on')        
      }
    }
  }

  function drawPreviewFigure(fig, clr) {    
    clr = clr % maxColors    
    const maxVerts = fig.x.length
    for(var i=0; i < maxVerts; i++) {      
      var idx = getPreviewCellIndex(fig.x[i], fig.y[i])
      if (idx >= 0 && idx < cellsPreviewList.length) {
        var e = $(cellsPreviewList[idx])
        e.attr('data-color', clr)        
        e.addClass('on')        
      }
    }
  }

  function drawStatic(dots) {
    const maxVerts = dots.length
    for(var i=0; i < maxVerts; i++) {                  
      var e = $(cellsList[i])
      var clr = dots[i]
      if (clr < 0) {
        e.removeClass('on')
      } else {
        e.attr('data-color', clr)
        e.addClass('on')
      }
    }
  }

  function getTimerDelay(level) {    
    const maxLevels = levelToSpeed.length    
    const i = Math.min(maxLevels-1, level)
    const speed = levelToSpeed[i] 
    const w = 1.0 / speed
    return w * 1000
  }

  function newGame() {
    const state = {
      run: false,     
      pause: false,   
      startLevel: params['startLevel'],
      figure: null,
      dots: [],
      nextColor: 0,      
      stat: {
        timeStart: null,
        timeLast: null,
        score: -1,
        level: -1,
        rows: -1,
        figures: -1,
        tetris: -1,
      },

      initState: function() {
        var i = field.width * field.height
        while(i--) {
          this.dots.push(emptyColor) // empty
        }
      },

      figureToStatic: function(fig) {        
        const maxVerts = fig.x.length
        for(var i=0; i < maxVerts; i++) {      
          var idx = getCellIndex(fig.x[i], fig.y[i])
          if (idx >= 0 && idx < cellsList.length) {
            this.dots[idx] = this.color
          }
        }
      },

      genNewColor: function() {
        /*const c = getRandValue(0, maxColors - 1)*/
        const c = this.nextColor
        this.nextColor = (c + 1)  % maxColors
        return c
      },

      newFigure: function() {    
        const newColor = this.genNewColor()
        const newIndex = getRandValue(0, figuresList.length - 1)
        const src = figuresList[newIndex]
    
        if (!this.figureNext) {      
          const newIndex2 = getRandValue(0, figuresList.length - 1)
          this.figureNext = figuresList[newIndex2]
          this.colorNext = this.genNewColor()
        }
    
        this.figure = this.figureNext
        this.figureNext = src    
        this.color = this.colorNext
        this.colorNext = newColor
        this.rotate = 0
        this.posX = field.width / 2 - src.bounds.max / 2 - 1
        this.posY = 0
    
        if (!this.testBounds()) {      
          this.stop()
        } else {
          this.stat.figures++
          this.render()
        }
      },

      testBounds: function(fig) {
        fig = fig || figureToView(this.figure, this.posX, this.posY, this.rotate)
        if (!fig) return
        const maxVerts = fig.x.length
        var x, y, idx
        for(var i=0; i < maxVerts; i++) {  
          x = fig.x[i]
          y = fig.y[i]    
          if (x < 0 || x >= field.width) return false
          if (/*y < 0 || */y >= field.height) return false      
          idx = getCellIndex(x, y)
          if (this.dots[idx] >= 0) return false
        }
        return true
      }, 

      replaceRow: function(row) {
        var i, j
        for(var x=0; x < field.width; x++) {
          i = getCellIndex(x, row)
          if (row > 0) {
            j = getCellIndex(x, row - 1)
            this.dots[i] = this.dots[j]
          } else {
            this.dots[i] = emptyColor // clear
          }
        }
      },

      removeRow: function(row) {    
        for(var y=row; y >= 0; y--) {
          this.replaceRow(y)
        }      
      },

      checkForCollapse: function(removeFilledRow = true) {
        var idx, filledDots, filledRows = 0
        
        for(var y=field.height-1; y >= 0; y--) 
        {
          filledDots = 0
        
          for(var x=0; x < field.width; x++) {
            idx = getCellIndex(x, y)
            if (this.dots[idx] >= 0) {
              filledDots++
            }
          }
        
          if (filledDots == field.width) {
            filledRows++
            if (removeFilledRow) {
              this.removeRow(y)
              y++
            }
          }
        }
    
        return filledRows
      }, 

      render: function() {    
        drawStatic(this.dots)
        if (this.figure) {      
          var fig = figureToView(this.figure, this.posX, this.posY, this.rotate)    
          drawFigure(fig, this.color)    
        }
      },

      moveDown: function(draw = true) {
        const y = this.posY + 1
        var fig = figureToView(this.figure, this.posX, y, this.rotate)    
        if (this.testBounds(fig)) {
          this.posY = y
          if (draw) this.render()
        } else {
          fig = figureToView(this.figure, this.posX, this.posY, this.rotate)
          this.figureToStatic(fig)
          if (draw) this.render()
          this.figure = null // need new figure                
    
          const removedRows = this.checkForCollapse(this)
          if (removedRows > 0) {
    
            // считаем очки
            const idx = Math.min(removedRows, 4) - 1        
            this.stat.score += scorePrice[idx]
            this.stat.rows += removedRows
    
            // это формация тетрис!
            if (removedRows >= 4) {
              this.stat.tetris++
            }        
    
            // осталось убрать строк до следующего уровня
            this.leftRowsToLevel -= removedRows
            if (this.leftRowsToLevel < 1) {
              this.leftRowsToLevel = rowsPerLevel
              this.stat.level++
            }
          }
        }
      },

      moveLeft: function() {
        const x = this.posX - 1
        const fig = figureToView(this.figure, x, this.posY, this.rotate)    
        if (this.testBounds(fig)) {
          this.posX = x
          this.render()
        } else {
          //console.warn("test failed")
        }
      },

      moveRight: function() {
        const x = this.posX + 1
        const fig = figureToView(this.figure, x, this.posY, this.rotate)    
        if (this.testBounds(fig)) {
          this.posX = x
          this.render()
        } else {
          //console.warn("test failed")
        }
      },

      nextRotation: function() {
        const r = (this.rotate + 1) % maxRotations
        const fig = figureToView(this.figure, this.posX, this.posY, r)
        if (this.testBounds(fig)) {
          this.rotate = r
          this.render()
        } else {
          //console.warn("test failed")
        }
      },

      drop: function() {
        var i = 0
        while (this.figure) {
          this.moveDown(false)
          i++
        }
        if (i > 0) this.render()
      },

      start: function() {
        this.run = true  
        this.pause = false
        this.pauseStart = null
        this.pauseDuration = 0
        this.leftRowsToLevel = rowsPerLevel
        this.stat.timeStart = new Date()
        this.stat.timeLast = this.stat.timeStart
        this.stat.level = this.startLevel
        this.stat.score = 0
        this.stat.rows = 0
        this.stat.figures = 0
        this.stat.tetris = 0

        params['onStart'].call(this)
    
        clearField()
        con.addClass('run')
        this.showPause(false)
        this.nextLoop()    
      },

      stop: function(byUser = false) {
        this.run = false
        this.showPause(false)        
        clearTimeout(loopTimer)
        con.removeClass('run')
        params['onStop'].call(this, byUser, this.stat) 
      },

      togglePause: function() {
        this.pause = !this.pause                
        if (this.pause) {
          this.pauseStart = new Date()
        } else {
          const t = new Date()          
          this.pauseDuration += t.getTime() - this.pauseStart.getTime()
        }
        params['onPause'].call(this, this.pause)
        this.showPause(this.pause)
      },

      showPause: function(on) {
        if (on) {
          con.addClass('paused')
        } else {
          con.removeClass('paused')
        }        
      },

      nextLoop: function() {
        if (!this.run) return
    
        this.stat.timeLast = new Date()
    
        if (!this.pause) {
          if (!this.figure) {
            this.newFigure()
          } else {    
            this.moveDown()
          }          
          this.updateInfo()
        }
    
        if (!this.run) return  
    
        var that = this
        const delay = getTimerDelay(this.stat.level)
        loopTimer = setTimeout(function() {
          that.nextLoop()
        }, delay)
      },

      updateInfo: function() {
        const s = this.stat
        
        if (s.timeLast != null) {
          var diff = s.timeLast.getTime() - s.timeStart.getTime()
          diff -= this.pauseDuration // учтём время проведённое в паузе
          s.duration = diff / 1000 // сохраним время в секундах
          const hours = Math.floor(diff / (1000 * 60 * 60))
          diff -= hours * (1000 * 60 * 60)
          const mins = Math.floor(diff / (1000 * 60))
          diff -= mins * (1000 * 60)
          const seconds = Math.floor(diff / (1000))
          infoValues['time'].html(pad(hours, 2)+':'+pad(mins, 2)+':'+pad(seconds, 2))
        } else {
          infoValues['time'].html('--:--:--')
        }
    
        infoValues['level'].html(s.level < 0 ? '--' : s.level)
        infoValues['score'].html(s.score < 0 ? '--' : s.score)
        infoValues['rows'].html((s.rows < 0 ? '--' : s.rows) + ' / ' + (this.leftRowsToLevel || '--'))
        infoValues['figures'].html(s.figures < 0 ? '--' : s.figures)
        infoValues['tetris'].html(s.tetris < 0 ? '--' : s.tetris)

        params['onStat'].call(this, this.stat)
    
        clearPreviewField()
        drawPreviewFigure(this.figureNext, this.colorNext)
      },

    } // const state

    state.initState()

    return state
  } 
  
  function buildCellsArray(container, width, height) {
    for(var row=0; row < height; row++)
      {
        for(var col=0; col < width; col++)
        {
          var cell = $('<div class="cell" data-color="" data-row="'+row+
            '" data-col="'+col+
            '" data-index="'+(row * width + col)+
            '"></div>')
            container.append(cell)          
        }
      }
  }

  return {
    version: '1.0',

    init: function() {      
      con.html('')
      con.addClass('tetris')

      const infoPanel = $('<div class="info"></div>')
      infoPanel.append('<div class="title">Тетрис</div>')      
      
      const preview = $('<div class="figure"><div class="cells"></div></div>')      
      buildCellsArray(preview.find('.cells'), fieldPreview.width, fieldPreview.height)
      cellsPreviewList = preview.find('.cell')
      infoPanel.append(preview)

      infoPanel.append('<div class="time"><span class="text">Время</span><span class="value">00:00:00</span></div>')
      infoPanel.append('<div class="level"><span class="text">Уровень</span><span class="value">--</span></div>')
      infoPanel.append('<div class="sum-score"><span class="text">Очки</span><span class="value">--</span></div>')
      infoPanel.append('<div class="sum-tetris"><span class="text">Тетрисы</span><span class="value">--</span></div>')
      infoPanel.append('<div class="sum-rows"><span class="text">Ряды</span><span class="value">--</span></div>')      
      infoPanel.append('<div class="sum-figures"><span class="text">Фигуры</span><span class="value">--</span></div>')
      infoPanel.append('<div class="other"></div>')
      infoPanel.append('<div class="help"><h4>управление</h4>'+        
        '<div class="item"><span class="key">&uarr;</span>поворот</div>'+
        '<div class="item"><span class="key">&larr;</span>влево</div>'+
        '<div class="item"><span class="key">&rarr;</span>вправо</div>'+
        '<div class="item"><span class="key">&darr;</span>сброс</div>'+
        '<div class="item"><span class="key">space</span>пауза</div>'+
        '<div class="item"><span class="key">esc</span>завершить</div>'+
        '<div class="item text">для начала или завершения игры <u>кликните</u></div>'+
        '</div>')
      con.append(infoPanel)

      infoValues['time'] = infoPanel.find('.time > .value')
      infoValues['level'] = infoPanel.find('.level > .value')
      infoValues['score'] = infoPanel.find('.sum-score > .value')
      infoValues['tetris'] = infoPanel.find('.sum-tetris > .value')
      infoValues['rows'] = infoPanel.find('.sum-rows > .value')
      infoValues['figures'] = infoPanel.find('.sum-figures > .value')
      
      const f = $('<div class="field"></div>')      
      buildCellsArray(f, field.width, field.height)
      cellsList = f.find('.cell')
      con.append(f)

      con.append('<div class="pauseModal"><div class="pauseCon">Пауза</div></div>')

      var gameState = null

      function requireStart() {
        params['onPrepare'](function() {
          gameState = newGame()    
          gameState.start()
        })
      }

      function requireStop() {
        params['onStopQuestion'](function() {
          gameState.stop(true)
          gameState = null            
        })  
      }

      $(document).keydown(function(e) {
        if (!gameState || !gameState.run) return

        switch(e.which) 
        {
          case KEY_ARROW_LEFT:            
            if (gameState.pause) return
            gameState.moveLeft()
            break
  
          case KEY_ARROW_RIGHT:
            if (gameState.pause) return
            gameState.moveRight()
            break
    
          default: 
            return
        }

        e.preventDefault()
      })

      $(document).keyup(function(e) {
        if (!gameState || !gameState.run) return

        switch(e.which) 
        {
          case KEY_ARROW_UP:
            if (gameState.pause) return
            gameState.nextRotation()
            break
            
          case KEY_ARROW_DOWN:
            if (gameState.pause) return
            gameState.drop()
            break

          case KEY_ESCAPE:
            if (!gameState.pause) {
              requireStop() // escape прерывает игру
              break; 
            }
            // escape снимает с паузы
          case KEY_SPACEBAR:   
            gameState.togglePause()
            break

          default: 
            return
        }

        e.preventDefault()
      })

      function updateContainerSize() {
        const h = con.height() // TODO: первый раз почему неверное значение?
        //const w = Math.floor(h / 2)
        const w = Math.floor(h / 1) // include information panel
        con.css('width', w+'px')
        //console.log('set width to', w, h)
      }
      $(window).resize(function() {
        updateContainerSize()
      })
      setTimeout(function() {
        updateContainerSize()
      },50)

      drawRandom()
      drawRandom(cellsPreviewList)

      con.click(function() {
        if (gameState && gameState.run) {
          requireStop()
        } else {
          requireStart()        
        }
      })
     
      return
    },

  } //  tetris object
}