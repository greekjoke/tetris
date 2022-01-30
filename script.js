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

  function newGame() {
    const state = {
      run: false,        
      startLevel: 5,
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
      }
    }

    var i = field.width * field.height
    while(i--) {
      state.dots.push(emptyColor) // empty
    }

    return state
  } 

  function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }

  function getRandValue(minValue, maxValue) {
    const x = maxValue - minValue
    const y = Math.floor(Math.random() * x + 0.5)
    return y + minValue
  }

  function getCellIndex(x, y) {
    if (x < 0 || y < 0 || x >= field.width || y >= field.height)
      return -1;
    return y * field.width + x
  }

  function getPreviewCellIndex(x, y) {
    if (x < 0 || y < 0 || x >= fieldPreview.width || y >= fieldPreview.height)
      return -1;
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
    });
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

  function figureToStatic(state, fig) {
    const maxVerts = fig.x.length
    for(var i=0; i < maxVerts; i++) {      
      var idx = getCellIndex(fig.x[i], fig.y[i])
      if (idx >= 0 && idx < cellsList.length) {
        state.dots[idx] = state.color
      }
    }
  }

  function genNewColor(state) {
    /*const c = getRandValue(0, maxColors - 1)*/
    const c = state.nextColor
    state.nextColor = (c + 1)  % maxColors
    return c
  }

  function newFigure(state) {    
    const newColor = genNewColor(state)
    const newIndex = getRandValue(0, figuresList.length - 1)
    const src = figuresList[newIndex]

    if (!state.figureNext) {      
      const newIndex2 = getRandValue(0, figuresList.length - 1)
      state.figureNext = figuresList[newIndex2]
      state.colorNext = genNewColor(state)
    }

    state.figure = state.figureNext
    state.figureNext = src    
    state.color = state.colorNext
    state.colorNext = newColor
    state.rotate = 0
    state.posX = field.width / 2 - src.bounds.max / 2 - 1
    state.posY = 0

    if (!testBounds(state)) {      
      stop(state)
    } else {
      state.stat.figures++
      render(state);
    }
  }

  function testBounds(state, fig) {
    fig = fig || figureToView(state.figure, state.posX, state.posY, state.rotate)
    if (!fig) return
    const maxVerts = fig.x.length
    var x, y, idx
    for(var i=0; i < maxVerts; i++) {  
      x = fig.x[i]
      y = fig.y[i]    
      if (x < 0 || x >= field.width) return false
      if (/*y < 0 || */y >= field.height) return false      
      idx = getCellIndex(x, y)
      if (state.dots[idx] >= 0) return false
    }
    return true
  }

  function replaceRow(state, row) {
    var i, j
    for(var x=0; x < field.width; x++) {
      i = getCellIndex(x, row)
      if (row > 0) {
        j = getCellIndex(x, row - 1)
        state.dots[i] = state.dots[j]
      } else {
        state.dots[i] = emptyColor // clear
      }
    }
  }

  function removeRow(state, row) {    
    for(var y=row; y >= 0; y--) {
      replaceRow(state, y)
    }      
  }

  function checkForCollapse(state, removeFilledRow = true) {
    var idx, filledDots, filledRows = 0
    
    for(var y=field.height-1; y >= 0; y--) 
    {
      filledDots = 0
    
      for(var x=0; x < field.width; x++) {
        idx = getCellIndex(x, y)
        if (state.dots[idx] >= 0) {
          filledDots++
        }
      }
    
      if (filledDots == field.width) {
        filledRows++
        if (removeFilledRow) {
          removeRow(state, y)
          y++
        }
      }
    }

    return filledRows
  }

  function render(state) {    
    drawStatic(state.dots)
    if (state.figure) {      
      var fig = figureToView(state.figure, state.posX, state.posY, state.rotate)    
      drawFigure(fig, state.color)    
    }
  }

  function moveDown(state, draw = true) {
    const y = state.posY + 1
    var fig = figureToView(state.figure, state.posX, y, state.rotate)
    if (testBounds(state, fig)) {
      state.posY = y
      if (draw) render(state)
    } else {
      fig = figureToView(state.figure, state.posX, state.posY, state.rotate)
      figureToStatic(state, fig)
      if (draw) render(state)
      state.figure = null // need new figure                
      const removedRows = checkForCollapse(state)
      if (removedRows > 0) {

        // считаем очки
        const idx = Math.min(removedRows, 4) - 1        
        state.stat.score += scorePrice[idx]
        state.stat.rows += removedRows

        // это формация тетрис!
        if (removedRows >= 4) {
          state.stat.tetris += removedRows
        }        

        // осталось убрать строк до следующего уровня
        state.leftRowsToLevel -= removedRows
        if (state.leftRowsToLevel < 1) {
          state.leftRowsToLevel = rowsPerLevel
          state.stat.level++
        }
      }
    }
  }

  function moveLeft(state) {
    const x = state.posX - 1
    const fig = figureToView(state.figure, x, state.posY, state.rotate)    
    if (testBounds(state, fig)) {
      state.posX = x
      render(state)
    } else {
      //console.warn("test failed")
    }
  }

  function moveRight(state) {
    const x = state.posX + 1
    const fig = figureToView(state.figure, x, state.posY, state.rotate)    
    if (testBounds(state, fig)) {
      state.posX = x
      render(state)
    } else {
      //console.warn("test failed")
    }
  }

  function nextRotation(state) {
    const r = (state.rotate + 1) % maxRotations
    const fig = figureToView(state.figure, state.posX, state.posY, r)
    if (testBounds(state, fig)) {
      state.rotate = r
      render(state)
    } else {
      //console.warn("test failed")
    }
  }

  function drop(state) {
    var i = 0
    while (state.figure) {
      moveDown(state, false)
      i++
    }
    if (i > 0) render(state)
  }

  function start(state) {
    console.log('START')    
    
    state.run = true  
    state.leftRowsToLevel = rowsPerLevel
    state.stat.timeStart = new Date()
    state.stat.timeLast = state.stat.timeStart
    state.stat.level = state.startLevel
    state.stat.score = 0
    state.stat.rows = 0
    state.stat.figures = 0
    state.stat.tetris = 0

    clearField()
    nextLoop(state)    
  }

  function stop(state) {
    state.run = false
    clearTimeout(loopTimer)        
    console.log('STOP')
  }

  function getTimerDelay(state) {    
    const maxLevels = levelToSpeed.length    
    const i = Math.min(maxLevels-1, state.stat.level)        
    const speed = levelToSpeed[i] 
    const w = 1.0 / speed
    return w * 1000
  }

  function nextLoop(state) {
    if (!state.run) return  

    state.stat.timeLast = new Date()

    if (!state.figure) {
      newFigure(state)
    } else {    
      moveDown(state)
    }
    updateInfo(state)

    if (!state.run) return  

    const delay = getTimerDelay(state)
    loopTimer = setTimeout(function() {
      nextLoop(state)
    }, delay);
  }

  function updateInfo(state) {
    const s = state.stat
    
    if (s.timeLast != null) {
      var diff = s.timeLast.getTime() - s.timeStart.getTime();
      s.duration = diff * 1000 // сохраним время в секундах
      const hours = Math.floor(diff / (1000 * 60 * 60));
      diff -= hours * (1000 * 60 * 60);
      const mins = Math.floor(diff / (1000 * 60));
      diff -= mins * (1000 * 60);
      const seconds = Math.floor(diff / (1000));
      infoValues['time'].html(pad(hours, 2)+':'+pad(mins, 2)+':'+pad(seconds, 2))
    } else {
      infoValues['time'].html('--:--:--')
    }

    infoValues['level'].html(s.level < 0 ? '--' : s.level)
    infoValues['score'].html(s.score < 0 ? '--' : s.score)
    infoValues['rows'].html(s.rows < 0 ? '--' : s.rows)
    infoValues['figures'].html(s.figures < 0 ? '--' : s.figures)
    infoValues['tetris'].html(s.tetris < 0 ? '--' : s.tetris)

    clearPreviewField()
    drawPreviewFigure(state.figureNext, state.colorNext)
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
      cellsPreviewList = preview.find('.cell');
      infoPanel.append(preview)

      infoPanel.append('<div class="time"><span class="text">Время</span><span class="value">00:00:00</span></div>')
      infoPanel.append('<div class="level"><span class="text">Уровень</span><span class="value">--</span></div>')
      infoPanel.append('<div class="sum-score"><span class="text">Очки</span><span class="value">--</span></div>')
      infoPanel.append('<div class="sum-tetris"><span class="text">Тетрисы</span><span class="value">--</span></div>')
      infoPanel.append('<div class="sum-rows"><span class="text">Ряды</span><span class="value">--</span></div>')      
      infoPanel.append('<div class="sum-figures"><span class="text">Фигуры</span><span class="value">--</span></div>')
      infoPanel.append('<div class="other"></div>')
      con.append(infoPanel)

      infoValues['time'] = infoPanel.find('.time > .value');
      infoValues['level'] = infoPanel.find('.level > .value');
      infoValues['score'] = infoPanel.find('.sum-score > .value');
      infoValues['tetris'] = infoPanel.find('.sum-tetris > .value');
      infoValues['rows'] = infoPanel.find('.sum-rows > .value');
      infoValues['figures'] = infoPanel.find('.sum-figures > .value');
      
      const f = $('<div class="field"></div>')      
      buildCellsArray(f, field.width, field.height)
      cellsList = f.find('.cell')
      con.append(f)

      var gameState = null

      $(document).keydown(function(e) {
        if (!gameState || !gameState.run) return;

        switch(e.which) 
        {
          case KEY_ARROW_LEFT:            
            moveLeft(gameState);
            break;
  
          case KEY_ARROW_RIGHT:
            moveRight(gameState);
            break;
    
          default: 
            return;
        }

        e.preventDefault();
      });

      $(document).keyup(function(e) {
        if (!gameState || !gameState.run) return;

        switch(e.which) 
        {
          case KEY_ARROW_UP:
            nextRotation(gameState);
            break;
            
          case KEY_ARROW_DOWN:
            drop(gameState)
            break;

          case KEY_SPACEBAR:   
            // TODO: toggle pause
            break;

          default: 
            return;
        }

        e.preventDefault();
      });

      drawRandom()
      drawRandom(cellsPreviewList)

      f.click(function() {
        if (gameState) {
          stop(gameState)
        }
        gameState = newGame()    
        start(gameState)
      })
     
      return
    },

  } //  tetris object
}