$(document).ready(() => {
    let n = $('#N').val()
    let m = $('#M').val()
    let door = [[0,0], [m-1,n-1]]
    let doorMoveStatus = 'IDLE'
    let manualStatus = 'IDLE'
    let doorEditable = false
    let manualEditable = false
    let filled = false
    let undo = false
    let adj = []
    let path = []
    let cr = []
    let cc = []
    let cases = []

    function updateConstraints() {
        cr = []
        cc = []

        for (let i = 0; i < m; i++) {
            if ($(`#cr-${i+1}`).val() != '') {
                cr.push(parseInt($(`#cr-${i+1}`).val()))
            } else {
                cr.push(-1)
            }
        }
        for (let j = 0; j < n; j++) {
            if ($(`#cc-${j+1}`).val() != '') {
                cc.push(parseInt($(`#cc-${j+1}`).val()))
            } else {
                cc.push(-1)
            }
        }
    } 

    function convertDoorColor(toSolver=false) {
        if (!toSolver) {
            $('.door').removeClass('bg-green-300')
            $('.door').addClass('bg-green-500') 
            return
        }
        $('.door').removeClass('bg-green-500')
        $('.door').addClass('bg-green-300') 
    }

    function addCellHoles(i, j) {
        if (i == 0 && j == 0) {
            if (j != n-1) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-right"></div>')
            }
            if (i != m-1) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-bottom"></div>')
            }
        } else if (i == m-1 && j == 0) {
            if (i != 0) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-top"></div>')
            }
            if (j != n-1) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-right"></div>')
            }
        } else if (i == 0 && j == n-1) {
            if (j != 0) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-left"></div>')
            }
            if (i != m-1) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-bottom"></div>')
            }
        } else if (i == m-1 && j == n-1) {
            $(`#cell-${i+1}-${j+1}`).append('<div class="hole-top"></div><div class="hole-left"></div>')
        } else if (i == 0) {
            if (i == m-1) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-left"></div><div class="hole-right"></div>')
                return
            }
            $(`#cell-${i+1}-${j+1}`).append('<div class="hole-bottom"></div><div class="hole-left"></div><div class="hole-right"></div>')
        } else if (j == 0) {
            if (j == n-1) {
                $(`#cell-${i+1}-${j+1}`).append('<div class="hole-bottom"></div><div class="hole-top"></div>')
                return
            }
            $(`#cell-${i+1}-${j+1}`).append('<div class="hole-bottom"></div><div class="hole-right"></div><div class="hole-top"></div>')
        } else if (i == m-1) {
            $(`#cell-${i+1}-${j+1}`).append('<div class="hole-left"></div><div class="hole-right"></div><div class="hole-top"></div>')
        } else if (j == n-1) {
            $(`#cell-${i+1}-${j+1}`).append('<div class="hole-bottom"></div><div class="hole-left"></div><div class="hole-top"></div>')
        } else {
            $(`#cell-${i+1}-${j+1}`).append('<div class="hole-bottom"></div><div class="hole-left"></div><div class="hole-right"></div><div class="hole-top"></div>')
        }
    }
    
    function updateInstance() {
        $('#instance').empty()
        n = $('#N').val()
        m = $('#M').val()
        for (let i = 0; i < m; i++) {
            $('#instance').append(`<div id="row_${i+1}" class="flex items-center"><\div>`)
            $(`#row_${i+1}`).append(
                `<input type="number" id="cr-${i+1}" value="${n}" class="cr flex items-center mr-2 bg-slate-100 rounded-full h-10 w-10 text-2xl place-content-center pl-2">`)
            for (let j = 0; j < n; j++) {
                $(`#row_${i+1}`).append(
                    `<div id=cell-${i+1}-${j+1} class="relative bg-white hover:bg-gray-200 cursor-pointer border-black border h-12 w-12"></div>`)
                    $(`#cell-${i+1}-${j+1}`).on('click', () => handleManualClick(i,j))
                if (i == 0 || i == m-1 || j == 0 || j == n-1) {
                    $(`#cell-${i+1}-${j+1}`).append('<div class="absolute edge w-full h-full opacity-40"></div>')
                    $(`#cell-${i+1}-${j+1}`).on('click', () => handleDoorClick(i,j))
                }
                addCellHoles(i, j)
                if (i == 0 && j == 0) {
                    $(`#cell-${i+1}-${j+1}`).append('<div class="door w-full h-full bg-green-300 opacity-70"></div>')
                    door[0] = [i,j]
                    addDoorHole(i,j)
                }
                if (i == m-1 && j == n-1) {
                    $(`#cell-${i+1}-${j+1}`).append('<div class="door w-full h-full bg-green-300 opacity-70"></div>')
                    door[1] = [m-1,n-1]
                    addDoorHole(i,j)
                }
            }
        }
        $('#instance').append(`<div id = CC class="flex gap-2 place-content-center ml-10 mt-2"><\div>`)
        for (let j = 0; j < n; j++) { 
            $('#CC').append(`<input type="number" id="cc-${j+1}" value="${m}" class="cc flex items-center bg-slate-100 rounded-full h-10 w-10 text-2xl place-content-center pl-2">`)
        }
    }
    
    function clearGrid() {
        path = []
        adj = []
        $('.path').remove()
        $('.path-dot').remove()
        manualStatus = 'IDLE'
        filled = false
        undo = false
        adj = []
        path = []
        if (manualEditable) {
            convertDoorColor() 
            setInfoText('select one door cell as a starting point')
        }
    }

    function addDoorHole(i, j) {
        if (j == 0) {
            $(`#cell-${i+1}-${j+1}`).append('<div class="door-hole hole-left"></div>')
        } else if (j == n-1) {
            $(`#cell-${i+1}-${j+1}`).append('<div class="door-hole hole-right"></div>')
        } else if (i == 0) {
            $(`#cell-${i+1}-${j+1}`).append('<div class="door-hole hole-top"></div>')
        } else {
            $(`#cell-${i+1}-${j+1}`).append('<div class="door-hole hole-bottom"></div>')
        }
    }

    function isValid(i, j) {
        return i >= 0 && i < m && j >= 0 && j < n
    }

    function getValidAjacentCells(i, j) {
        ret = []
        dx = [1,0,0,-1]
        dy = [0,-1,1,0]
        for (let dir = 0; dir < 4; dir++) {
            let ii = i + dx[dir]
            let jj = j + dy[dir]
            if (isValid(ii,jj) && $(`#cell-${ii+1}-${jj+1}`).find('.path-dot').length == 0) {
                ret.push([ii,jj])
            }
        }
        return ret
    }

    function markAdjacentCells() {
        for (let idx = 0; idx < adj.length; idx++) {
            let ic = adj[idx][0]
            let jc = adj[idx][1]
            $(`#cell-${ic+1}-${jc+1}`).append('<div class="path-dot pot opacity-50"></div>')
        }
    }

    function unmarkAdjacentCells() {
        $('.pot').remove()
    }

    function verify() {
        let invalid = []
        let isIncompliant = false
        updateConstraints()
        for (let idx = 0; idx < path.length; idx++) {
            if (cr[path[idx][0]] - 1 == -1) {
                cr[path[idx][0]] = 999
            } else if (cc[path[idx][1]] - 1 == -1) {
                cc[path[idx][1]] = 999
            }
            if (cr[path[idx][0]] != -1) cr[path[idx][0]] = cr[path[idx][0]] -1
            if (cc[path[idx][1]] != -1) cc[path[idx][1]] = cc[path[idx][1]] -1
        }
        for (let i = 0; i < m; i++) {
            if (cr[i] > 0)  {
                invalid.push(`cr-${i+1}`)
                isIncompliant = true
            }
        }
        for (let j = 0; j < n; j++) {
            if(cc[j] > 0) {
                invalid.push(`cc-${j+1}`)
                isIncompliant = true
            }
        }
        updateConstraints()
        return [!isIncompliant, invalid]
    }

    function removePath(i, j) {
        $(`#cell-${i+1}-${j+1}`).find('.path-dot').remove()
        $(`#cell-${i+1}-${j+1}`).find('.path').remove()
    }

    function undoPath() {
        if (path.length == 0) return

        unmarkAdjacentCells()
        let currentCell = path[path.length-1]

        if (path.length == 2) {
            path.pop()
            let lastCell = path[path.length-1]
            path.pop()
            removePath(currentCell[0], currentCell[1])
            removePath(lastCell[0], lastCell[1])
            manualStatus = 'IDLE'
            filled = false
            convertDoorColor()
            handleManualClick(lastCell[0], lastCell[1])
        }
        else if (path.length == 1) {
            path.pop()
            removePath(currentCell[0], currentCell[1])
            convertDoorColor()
            manualStatus = 'IDLE'
            filled = false
            setInfoText('select one door cell as a starting point')
        } else {
            path.pop()
            let lastCell = path[path.length-1]
            path.pop()
            undo = true
            removePath(currentCell[0], currentCell[1])
            removePath(lastCell[0], lastCell[1])
            if (manualStatus == 'IDLE') manualStatus = 'MOVE'
            handleManualClick(lastCell[0], lastCell[1])
            setInfoText('reach the ending cell')
        } 
    }

    function handleManualClick(i, j) {
        if (!manualEditable) return
        if (manualStatus == 'IDLE') {
            if (!door.some(([x,y]) => x == i && y == j) || filled) return
            convertDoorColor(true)
            $(`#cell-${i+1}-${j+1}`).append('<div class="path-dot"></div>')
            path.push([i,j])
            adj = getValidAjacentCells(i,j)
            markAdjacentCells()
            manualStatus = 'MOVE'
            filled = true

            setInfoText('reach the ending cell')
        } else if (manualStatus == 'MOVE') {
            dx = [1,0,0,-1]
            dy = [0,-1,1,0]
            divs = [
                '<div class="path path-down"></div>',
                '<div class="path path-left"></div>',
                '<div class="path path-right"></div>',
                '<div class="path path-up"></div>',
            ]
            if (!adj.some(([x,y]) => x == i && y == j) && !undo) return
            undo = false
            unmarkAdjacentCells()
            let lastCell = path[path.length - 1]
            $(`#cell-${i+1}-${j+1}`).append('<div class="path-dot"></div>')
            for (let dir = 0; dir < 4; dir++) {
                if (i + dx[dir] == lastCell[0] && j + dy[dir] == lastCell[1]) {
                    $(`#cell-${i+1}-${j+1}`).append(divs[dir])
                }
            }

            path.push([i,j]) 
            if (door.some(([x,y]) => x == i && y == j)) {
                const verdict = verify(path)
                if (verdict[0]) {
                    setNaviText('congrats, your solution is correct ✨', false)
                    setInfoText('try another case or another solution! 🤓')
                    manualStatus = 'IDLE'
                } else {
                    verdict[1].forEach((element) => {
                        $(`#${element}`).removeClass('bg-slate-100')
                        $(`#${element}`).addClass('bg-red-200')
                        setTimeout(() => {
                            $(`#${element}`).removeClass('bg-red-200')
                            $(`#${element}`).addClass('bg-slate-100')
                        }, 800)
                    })
                    setNaviText('your solution is incorrect, try again? 😄')
                    undoPath()
                }
                return
            }
            adj = getValidAjacentCells(i,j)
            markAdjacentCells()
        }
    } 

    function handleDoorClick(i, j) {
        if (!doorEditable) return
        
        if (doorMoveStatus == 'IDLE') {
            if (!door.some(([x,y]) => x == i && y == j)) return
            $(`#cell-${i+1}-${j+1}`).find('.door').remove()
            $(`#cell-${i+1}-${j+1}`).find('.door-hole').remove()

            let newDoor = [];
            for (var k = 0; k < door.length; k++) {
                if (door[k][0] !== i || door[k][1] !== j) {
                    newDoor.push(door[k])
                }
            }
            door = newDoor
            doorMoveStatus = 'MOVE'

            setInfoText('select the new cell')
        } else {
            if (door.some(([x,y]) => x == i && y == j)) {
                setNaviText('the door cells must be distinct cells ☝️')
                return
            }
            door.push([i,j])
            $(`#cell-${i+1}-${j+1}`).append('<div class="door w-full h-full bg-green-300 opacity-70"></div>')
            addDoorHole(i,j)
            doorMoveStatus = 'IDLE'

            setInfoText('select a door cell you want to move')
        }
    }

    function disableRange() {
        $('#M').prop('disabled', true)
        $('#N').prop('disabled', true)
    }

    function enableRange() {
        $('#M').prop('disabled', false)
        $('#N').prop('disabled', false)
    }
    
    function disableSolve() {
        $('#solveButton').prop('disabled', true)
        $('#solveButton').addClass('bg-gray-300')
        $('#solveButton').addClass('rounded-full')
        $('#solveButton').removeClass('bg-yellow-300')
        $('#solveButton').removeClass('hover:bg-yellow-400')
        $('#solveButton').removeClass('active:bg-yellow-500')
    }

    function enableSolve() {
        $('#solveButton').prop('disabled', false)
        $('#solveButton').removeClass('bg-gray-300')
        $('#solveButton').addClass('bg-yellow-300')
        $('#solveButton').addClass('hover:bg-yellow-400')
        $('#solveButton').addClass('active:bg-yellow-500')
    }

    function disableDoor() {
        $('#doorButton').prop('disabled', true)
        $('#doorButton').addClass('bg-gray-300')
        $('#doorButton').addClass('rounded-full')
        $('#doorButton').removeClass('bg-orange-600')
        $('#doorButton').removeClass('hover:bg-orange-700')
        $('#doorButton').removeClass('active:bg-orange-800')
        $('#doorButton').removeClass('text-white')
        $('#doorButton').addClass('text-black')
    }

    function enableDoor() {
        $('#doorButton').prop('disabled', false)
        $('#doorButton').removeClass('bg-gray-300')
        $('#doorButton').addClass('bg-orange-600')
        $('#doorButton').addClass('hover:bg-orange-700')
        $('#doorButton').addClass('active:bg-orange-800')
        $('#doorButton').removeClass('text-black')
        $('#doorButton').addClass('text-white')
    }

    function disableUndo() {
        $('#undoButton').prop('disabled', true)
        $('#undoButton').addClass('bg-gray-300')
        $('#undoButton').addClass('rounded-full')
        $('#undoButton').addClass('text-black')
        $('#undoButton').removeClass('bg-red-600')
        $('#undoButton').removeClass('hover:bg-red-700')
        $('#undoButton').removeClass('active:bg-red-800')
        $('#undoButton').removeClass('text-white')
    }

    function enableUndo() {
        $('#undoButton').prop('disabled', false)
        $('#undoButton').removeClass('bg-gray-300')
        $('#undoButton').addClass('bg-red-600')
        $('#undoButton').addClass('hover:bg-red-700')
        $('#undoButton').addClass('active:bg-red-800')
        $('#undoButton').removeClass('text-black')
        $('#undoButton').addClass('text-white')
    }

    function disableMode() {
        $('#modeButton').prop('disabled', true)
        $('#modeButton').addClass('bg-gray-300')
        $('#modeButton').addClass('rounded-full')
        $('#modeButton').addClass('text-black')
        $('#modeButton').removeClass('bg-lime-600')
        $('#modeButton').removeClass('hover:bg-lime-700')
        $('#modeButton').removeClass('active:bg-lime-800')
        $('#modeButton').removeClass('text-white')
    }

    function enableMode() {
        $('#modeButton').prop('disabled', false)
        $('#modeButton').removeClass('bg-gray-300')
        $('#modeButton').addClass('bg-lime-600')
        $('#modeButton').addClass('hover:bg-lime-700')
        $('#modeButton').addClass('active:bg-lime-800')
        $('#modeButton').removeClass('text-black')
        $('#modeButton').addClass('text-white')
    }

    function setNaviText(text, warning=true) {
        if (!warning) {
            $('#navi').removeClass('text-red-600')
            $('#navi').addClass('text-green-600')
        }
        $('#navi').text(text)
        
        setTimeout(() => {
            if (!warning) {
                $('#navi').addClass('text-red-600')
                $('#navi').removeClass('text-green-600')
            } 
            $('#navi').empty()
        }, 7000)
    }

    function setInfoText(text='') {
        $('#info').text(text)
    }

    function disableCase() {
        $('#caseDropdown').prop('disabled', true)
        $('#caseDropdown').addClass('text-gray-600')
    }

    function enableCase() {
        $('#caseDropdown').prop('disabled', false)
        $('#caseDropdown').removeClass('text-gray-600')
    }

    function disableConstraints() {
        for (let i = 0; i < m; i++) {
            $(`#cr-${i+1}`).prop('disabled', true)
            $(`#cr-${i+1}`).addClass('text-gray-600')
        }
        for (let j = 0; j < n; j++) {
            $(`#cc-${j+1}`).prop('disabled', true)
            $(`#cc-${j+1}`).addClass('text-gray-600')
        }
    }

    function enableConstraints() {
        for (let i = 0; i < m; i++) {
            $(`#cr-${i+1}`).prop('disabled', false)
            $(`#cr-${i+1}`).removeClass('text-gray-600')
        }
        for (let j = 0; j < n; j++) {
            $(`#cc-${j+1}`).prop('disabled', false)
            $(`#cc-${j+1}`).removeClass('text-gray-600')
        }
    }

    async function fetchCases() {
        disableCase()
        $.get('api/case', (res, status) => {
            let num = 0
            cases = res.data
            let easys = cases.filter((item) => item.name.startsWith('easy'))
            easys.sort((a,b) => parseInt(a.name.split('-')[1]) - parseInt(b.name.split('-')[1]))
            let meds = cases.filter((item) => item.name.startsWith('medium'))
            meds.sort((a,b) => parseInt(a.name.split('-')[1]) - parseInt(b.name.split('-')[1]))
            let hards = cases.filter((item) => item.name.startsWith('hard'))
            hards.sort((a,b) => parseInt(a.name.split('-')[1]) - parseInt(b.name.split('-')[1]))
            cases = [...easys, ...meds, ...hards]
            cases.map((item) => {
                num++
                let name = item.name.split('-')
                name[0] = name[0].charAt(0).toUpperCase() + name[0].slice(1)
                $('#caseDropdown').append(`<option value="${num}">${name[0]} ${name[1]}</option>`)
            })
        })
        enableCase()
    }

    $('#fillGrid').change(() => {
        if (!$('#fillGrid').prop('checked')) {
            $('.solve-text').text('Check!')
        } else {
            $('.solve-text').text('Solve!')
        }
    })

    $('#caseDropdown').change(() => {
        const idx = parseInt($('#caseDropdown').val())
        if (idx == 0) return
        const instance = cases[idx-1].instance
        $('#M').val(instance.m)
        $('#N').val(instance.n)
        $('#rangeValueM').text($('#M').val())
        $('#rangeValueN').text($('#N').val())
        updateInstance()

        const start = [instance.start_x, instance.start_y]
        const finish = [instance.finish_x, instance.finish_y]
        $(`#cell-${1}-${1}`).find('.door').remove()
        $(`#cell-${1}-${1}`).find('.door-hole').remove()
        $(`#cell-${m}-${n}`).find('.door').remove()
        $(`#cell-${m}-${n}`).find('.door-hole').remove()
        door = [start, finish]
        $(`#cell-${start[0]+1}-${start[1]+1}`).append('<div class="door w-full h-full bg-green-300 opacity-70"></div>')
        $(`#cell-${finish[0]+1}-${finish[1]+1}`).append('<div class="door w-full h-full bg-green-300 opacity-70"></div>')
        addDoorHole(start[0],start[1])
        addDoorHole(finish[0],finish[1])
        clearGrid()

        const r = instance.cr
        const c = instance.cc
        for (let i = 0; i < m; i++) {
            if (r[i] == -1) {
                $(`#cr-${i+1}`).val('')
                continue
            }
            $(`#cr-${i+1}`).val(r[i])
        }
        for (let j = 0; j < n; j++) {
            if (c[j] == -1) {
                $(`#cc-${j+1}`).val('')
                continue
            }
            $(`#cc-${j+1}`).val(c[j])
        }
        updateConstraints()
        if (manualEditable) disableConstraints()
        setNaviText(`you got it! 😉`, false)
    })

    $('#undoButton').click(() => {
        undoPath()
    })

    $('#modeButton').click(() => {
        manualEditable = !manualEditable
        if (manualEditable) {
            $('.mode-text').text('Give Up')
            $('#modeButton').removeClass('bg-lime-600')
            $('#modeButton').removeClass('hover:bg-lime-700')
            $('#modeButton').removeClass('active:bg-lime-800')
            $('#modeButton').addClass('rounded-full')
            $('#modeButton').addClass('bg-pink-600')
            $('#modeButton').addClass('hover:bg-pink-700')
            $('#modeButton').addClass('active:bg-pink-800')

            disableConstraints()
            disableSolve()
            disableRange()
            disableDoor()
            clearGrid()
            enableUndo()
            convertDoorColor()

            setInfoText('select one door cell as a starting point')
        } else {
            $('.mode-text').text('Solve It Yourself')
            $('#modeButton').addClass('bg-lime-600')
            $('#modeButton').addClass('hover:bg-lime-700')
            $('#modeButton').addClass('active:bg-lime-800')
            $('#modeButton').removeClass('bg-pink-600')
            $('#modeButton').removeClass('hover:bg-pink-700')
            $('#modeButton').removeClass('active:bg-pink-800')

            enableConstraints()
            enableSolve()
            enableRange()
            enableDoor()
            clearGrid()
            disableUndo()
            convertDoorColor(true)
            manualStatus = 'IDLE'
            filled = false
            undo = false
            adj = []
            path = []

            setInfoText()
        }
    })

    $('#doorButton').click(() => {
        if (doorMoveStatus != 'IDLE') {
            setNaviText('select a cell first before finishing 😌')
            return
        }
        doorEditable = !doorEditable
        if (doorEditable) {
            $('.door-text').text('Finish Changing')
            $('#doorButton').removeClass('bg-orange-600')
            $('#doorButton').removeClass('hover:bg-orange-700')
            $('#doorButton').removeClass('active:bg-orange-800')
            $('#doorButton').addClass('rounded-full')
            $('#doorButton').addClass('bg-teal-600')
            $('#doorButton').addClass('hover:bg-teal-700')
            $('#doorButton').addClass('active:bg-teal-800')

            disableSolve()
            disableRange()
            disableMode()
            disableCase()
            $('.edge').addClass('bg-blue-300')
            $('.edge').addClass('opacity-85')

            setInfoText('select a door cell you want to move')
        } else {
            $('.door-text').text('Change Door Cell')
            $('#doorButton').addClass('bg-orange-600')
            $('#doorButton').addClass('hover:bg-orange-700')
            $('#doorButton').addClass('active:bg-orange-800')
            $('#doorButton').removeClass('bg-teal-600')
            $('#doorButton').removeClass('hover:bg-teal-700')
            $('#doorButton').removeClass('active:bg-teal-800')

            enableRange()
            enableSolve()
            enableMode()
            enableCase()
            $('.edge').removeClass('bg-blue-300')
            $('.edge').removeClass('opacity-85')

            setInfoText()
        }
    })

    $('#clearButton').click(() => {
        clearGrid()
    })

    $('#M').change(() => {
        if ($('#M').val() == 1 && $('#M').val() == $('#N').val()) {
            setNaviText('1x1 puzzle grid is invalid 🫤')
            $('#M').val(m)
            return
        }
        $('#rangeValueM').text($('#M').val())
        updateInstance()
    })

    $('#N').change(() => {
        if ($('#N').val() == 1 && $('#M').val() == $('#N').val()) {
            setNaviText('1x1 puzzle grid is invalid 🥲')
            $('#N').val(n)
            return
        }
        $('#rangeValueN').text($('#N').val())
        updateInstance()
    })

    $('#instance')
    .on('change', '.cr', (e) => {
        if (Number(e.target.value) > n) {
            e.target.value = n
        }
        if (Number(e.target.value) < 0) {
            e.target.value = 0
        }
    }).on('change', '.cc', (e) => {
        if (Number(e.target.value) > m) {
            e.target.value = m
        }
        if (Number(e.target.value) < 0) {
            e.target.value = 0
        }
    })

    $('#solveButton').click(async () => {
        disableCase()
        disableRange()
        disableDoor()
        disableMode()
        if ($('#fillGrid').prop('checked')) {
            $('.solve-text').text('Solving...')
        } else {
            $('.solve-text').text('Checking...')
        }
        updateConstraints()

        let body = JSON.stringify({
            m: parseInt(m),
            n: parseInt(n),
            start_x: door[0][0],
            start_y: door[0][1],
            finish_x: door[1][0],
            finish_y: door[1][1],
            cr: cr,
            cc: cc,
        })
        $.post('api/solve', body, (res, status) => {
            enableCase()
            enableRange()
            enableDoor()
            enableMode()
            if ($('#fillGrid').prop('checked')) {
                $('.solve-text').text('Solve!')
            } else {
                $('.solve-text').text('Check!')
            }
            clearGrid()

            if (!$('#fillGrid').prop('checked')) {
                if (!res.found) {
                    setNaviText('no solution for this one 🫤')
                } else {
                    setNaviText('this grid has a solution! 😏', false)
                }
                return
            }

            if (!res.found) {
                setNaviText('seems like this grid has no solution 🙁')
                return
            }
            const grid = res.grid
            for (let i = 0; i < m; i++) {
                for (let j = 0; j < n; j++) {
                    if (grid[i][j] != '.') {
                        $(`#cell-${i+1}-${j+1}`).append('<div class="path-dot"></div>')
                        if (i == door[1][0] && j == door[1][1]) continue
                        if (grid[i][j] == 'd') {
                            $(`#cell-${i+1}-${j+1}`).append('<div class="path path-down"></div>')
                        } else if (grid[i][j] == 'l') {
                            $(`#cell-${i+1}-${j+1}`).append('<div class="path path-left"></div>')
                        } else if (grid[i][j] == 'r') {
                            $(`#cell-${i+1}-${j+1}`).append('<div class="path path-right"></div>')
                        } else {
                            $(`#cell-${i+1}-${j+1}`).append('<div class="path path-up"></div>')
                        }
                    }
                }
            }
            setNaviText('solution found! 😎', false)
        })
    })
    updateInstance()
    disableUndo()
    fetchCases()
})