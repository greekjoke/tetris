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

  const maxColors = 6
  const maxRotations = 4 // 0, 90, 180, 270
  const maxCellEdge = 4 // NxN
  const field = {width:10, height:20}  
    
  const figureI = {
    code:'I', // палка
    x:[0,1,2,3], // x
    y:[0,0,0,0], // y
    pivot:0, // точка вращения
  }

  const figureJ = {
    code:'J', // угол левый
    x:[1,1,1,0], // x
    y:[0,1,2,2], // y
    pivot:2, // точка вращения
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

  var cellsList = $('')
  const figuresList = [figureI, figureJ, figureL, figureO, figureS, figureZ, figureT]
  
  for(const k in figuresList) {
    const fig = figuresList[k]
    fig.bounds = {
      x:Math.max.apply(null, fig.x), 
      y:Math.max.apply(null, fig.y)
    }
  }

  function getCellIndex(x, y) {
    if (x < 0 || y < 0 || x >= field.width || y >= field.height)
      return -1;
    return y * field.width + x
  }

  function clearField() {
    cellsList.removeClass('on')
  }

  function figureToView(fig, x, y, rotate) {
    rotate = (fig.pivot < 0) ? 0 : (rotate % maxRotations)
    const maxVerts = fig.x.length, ox = [], oy = []    
    const px = fig.x[fig.pivot], py = fig.y[fig.pivot]    
    const bm = Math.max(fig.bounds.x, fig.bounds.y)
    var vx, vy, tx, ty
    for(var i=0; i < maxVerts; i++) {      
      vx = fig.x[i]
      vy = fig.y[i]
      switch(rotate) {                
        case 0: // 0 degrees          
          // already
          break
        case 1: // 90 degrees          
          tx = bm - vy
          ty = vx
          vx = tx// - Math.floor(bx/2)
          vy = ty// - Math.floor(by/2)
          break
        case 2: // 180 degrees
          tx = bm - vx
          ty = bm - vy
          vx = tx// - Math.floor(bx/2)
          vy = ty// - Math.floor(by/2)
          break
        case 3: // 270 degrees
          tx = vy
          ty = bm - vx
          vx = tx// - Math.floor(bx/2)
          vy = ty// - Math.floor(by/2)
          break
      }      
      ox.push(vx + x)
      oy.push(vy + y)
    }
    return {x:ox, y:oy}
  }

  function drawFigure(fig, x, y, rotate, clr) {       
    clr = clr % maxColors
    const v = figureToView(fig, x, y, rotate)
    const maxVerts = v.x.length
    for(var i=0; i < maxVerts; i++) {      
      var idx = getCellIndex(v.x[i], v.y[i])
      if (idx >= 0 && idx < cellsList.length) {
        var e = $(cellsList[idx])
        e.addClass('on')
        e.addClass('c'+clr)
      }
    }
  }

  return {
    version: '1.0',

    init: function() {      
      con.html('')
      con.addClass('tetris')

      const f = $('<div class="field"></div>')
      con.append(f)

      for(var row=0; row < field.height; row++)
      {
        for(var col=0; col < field.width; col++)
        {
          var cell = $('<div class="cell" data-row="'+row+
            '" data-col="'+col+
            '" data-index="'+(row * field.width + col)+
            '"></div>')

          f.append(cell)
          cellsList = cellsList.add(cell)
        }
      }

      var tick = 0
      var timer = setInterval(function() {        
        console.log('tick', tick)
        clearField()
        drawFigure(figureL, 2,2, tick, 0)
        //clearInterval(timer)    
        tick++
      }, 800)
      

      return
    },

    


  } //  tetris object
}