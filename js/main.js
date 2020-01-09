window.addEventListener('load', _ => {
    Settings.initIfNot();

    fetch(`config.json?cacheBust=${new Date().getTime()}`).then(response => { return response.json() }).then(config => {
        //document.body.append(JSON.stringify(config))
        document.body.append(`pv ${Settings.getVersion()}  `)
        if (Settings.getVersion() == 0 && false) {
            Settings.setVersion(config.version)
        }
        else if (Settings.getVersion() != config.version) {
            alert('new version found')
            Settings.setVersion(config.version)
            document.body.append('adding new version')
            fetch(`config.json?clean-cache=true&cacheBust=${new Date().getTime()}`).then(_ => {
                document.body.append('cache cleaned')
                alert('cache cleaned')
                window.location.reload(true);
            })
           
        }
    })

    let currentScore = 0;
    let maxScore = Settings.getMaxScore();

    let axe = 0;
    let ye = 0;
    let zee = 0;
    let lockedAxis = {};
    let positionLocked = false

    let flag = true;
    let xDom = document.querySelector('#x');
    let yDom = document.querySelector('#y');
    let zDom = document.querySelector('#z');
    let op = document.querySelector('#op');
    let lockBtn = document.querySelector('#lockBtn');
    let delta = document.querySelector('#delta');
    delta.value = Number.parseInt(Settings.getSensitivity());
    delta.addEventListener('change', updateSensitivity)
    delta.addEventListener('keyup', updateSensitivity)
    let allAxis = document.querySelector('#allAxis');
    let portraitRadioY = document.querySelector('#yAxis');
    let landscapeRadioZ = document.querySelector('#zAxis');
    const currentScoreValue = document.querySelector('#currentScoreValue')
    const maxScoreValue = document.querySelector('#maxScoreValue');
    maxScoreValue.innerHTML = Math.floor(maxScore);
    const indicator = document.querySelector('#indicator');
    document.querySelector('#whatsAppShare').addEventListener('click', _ => {
        let anchor = document.createElement('a');
        let greetings = ``;
        if (maxScore > 0) {
            greetings = `${Math.floor(maxScore)}!! My new max score in Posture Fix!  Improve your sitting posture & beat my score ${document.location.href}`
        }
        else {
            greetings = `Improve your sitting posture by using Posture Fix!! check this ${document.location.href}`
        }
        greetings = encodeURIComponent(greetings)
        anchor.href = `whatsapp://send?text=${greetings}`
        anchor.setAttribute('target', '_blank')
        anchor.click();
    })

    document.querySelector('#facebookShare').addEventListener('click', _ => {
        let anchor = document.createElement('a');
        let greetings = ``;
        if (maxScore > 0) {
            greetings = `${Math.floor(maxScore)}!! My new max score in Posture Fix! Improve your sitting posture & beat my score`
        }
        else {
            greetings = `Improve your sitting posture by using Posture Fix!! check this`
        }
        greetings = encodeURIComponent(greetings)
        anchor.href = `https://www.facebook.com/sharer/sharer.php?u=${document.location.href}&quote=${greetings}`
        anchor.setAttribute('target', '_blank')
        anchor.click();
    })

    document.querySelector('#twitterShare').addEventListener('click', _ => {
        let anchor = document.createElement('a');
        let greetings = ``;
        if (maxScore > 0) {
            greetings = `${Math.floor(maxScore)}!! My new max score in Posture Fix! Improve your sitting posture & beat my score`
        }
        else {
            greetings = `Improve your sitting posture by using Posture Fix!! check this`
        }
        greetings = encodeURIComponent(greetings)
        anchor.href = `https://twitter.com/intent/tweet?url=${document.location.href}&text=${greetings}&related=postureFixz`
        anchor.setAttribute('target', '_blank')
        anchor.click();
    })


    let throttled = false;
    window.addEventListener('deviceorientation', (event) => {

        if (!throttled) {
            throttled = true;
            setTimeout((event) => {
                if (positionLocked === true) {
                    let goodPosition = true;
                    op.innerHTML = '';
                    if (allAxis.checked && Math.abs(event.alpha - lockedAxis.x) > Number.parseFloat(delta.value)) {
                        op.innerHTML = `Out Of posture by x ${Math.round(event.alpha)}<br/>`
                        goodPosition = false;
                        notifyIncorrectPosture();

                    }
                    if ((allAxis.checked || portraitRadioY.checked) && Math.abs(event.beta - lockedAxis.y) > Number.parseFloat(delta.value)) {
                        op.innerHTML += `Out Of posture by Y ${Math.round(event.beta)}<br/>`
                        goodPosition = false;
                        notifyIncorrectPosture();
                    }
                    if ((allAxis.checked || landscapeRadioZ.checked) && Math.abs(event.gamma - lockedAxis.z) > Number.parseFloat(delta.value)) {
                        op.innerHTML += `Out Of posture by Z ${Math.round(event.gamma)}<br/>`
                        goodPosition = false;
                        notifyIncorrectPosture();
                    }
                    if (goodPosition) {
                        op.innerHTML += `Good Possition detected`
                        if (incorrectPostureTimer != null) {
                            clearInterval(incorrectPostureTimer);
                            incorrectPostureTimer = null;
                            repositionSound.play();
                            window.navigator.vibrate([100, 100, 100]);
                        }
                        if (positionLocked === true) {
                            currentScore += .3;
                            indicator.classList.add('indicator-goodPosture')
                            indicator.classList.remove('indicator-badPosture')
                        }

                    } else {
                        if (positionLocked === true) {
                            currentScore = currentScore > .15 ? currentScore - .15 : 0;
                            indicator.classList.add('indicator-badPosture')
                            indicator.classList.remove('indicator-goodPosture')
                        }
                    }
                    if (currentScore > maxScore) {
                        maxScore = currentScore;
                        Settings.setMaxScore(maxScore);
                        maxScoreValue.innerHTML = Math.floor(currentScore);
                    }
                    currentScoreValue.innerHTML = Math.floor(currentScore);

                }
                else {
                    op.innerHTML = ``
                    clearInterval(incorrectPostureTimer)
                    incorrectPostureTimer = null;
                    axe = Math.round(event.alpha);
                    if (allAxis.checked) {
                        xDom.innerHTML = `X ${axe}`;
                    } else {
                        xDom.innerHTML = ''
                    }
                    ye = Math.round(event.beta);
                    if (allAxis.checked || portraitRadioY.checked) {
                        yDom.innerHTML = `Y ${ye}`;
                    }
                    else {
                        yDom.innerHTML = ''
                    }
                    zee = Math.round(event.gamma);
                    if (allAxis.checked || landscapeRadioZ.checked) {
                        zDom.innerHTML = `Z ${zee}`;
                    } else {
                        zDom.innerHTML = ''
                    }
                }
                throttled = false;
            }, 500, event)
        }

    })

    let incorrectPostureTimer = null;

    function notifyIncorrectPosture() {
        if (incorrectPostureTimer == null) {
            window.navigator.vibrate([200]);
            negativeSound.play();
            incorrectPostureTimer = setInterval(_ => {
                window.navigator.vibrate([200]);
                negativeSound.play();
            }, 2000)
        }


    }

    const noSleep = new NoSleep();
    let detectPositionTimer = null;
    document.querySelector('#lockBtn').addEventListener('click', event => {


        if (positionLocked === 'IN_PROGRESS' || positionLocked == true) {
            clearInterval(detectPositionTimer);
            positionLocked = false;
            lockBtn.innerHTML = "Start";
            indicator.classList.remove('indicator-searching')
            indicator.classList.remove('indicator-goodPosture')
            indicator.classList.remove('indicator-badPosture')
            window.navigator.vibrate([100, 100, 100]);
            noSleep.disable();

        } else {
            positionLocked = 'IN_PROGRESS'
            lockBtn.innerHTML = "Detecting Position";
            indicator.classList.add('indicator-searching')
            detectPositionTimer = setInterval(detectPosition, 100);

            noSleep.enable();

        }

    })

    function lockPosition() {
        lockedAxis.x = axe;
        lockedAxis.y = ye;
        lockedAxis.z = zee;
        positionLocked = true
        possitiveSound.play();
        currentScore = 0;
        window.navigator.vibrate([100, 100, 100]);

        lockBtn.innerHTML = "Stop";

    }

    function updateSensitivity() {
        Settings.setSensitivity(this.value)
    }

    let positionDetectionConfidence = 0;
    let temp = {
        x: -3535
    }
    function detectPosition() {
        if (Math.abs(temp.x - axe) < 1) {
            positionDetectionConfidence++;

        } else {
            positionDetectionConfidence = 0;
            console.log('Confidence reset')
            temp.x = axe
        }
        if (getComputedStyle(lockBtn).borderWidth == '3px') {
            lockBtn.style.borderWidth = '4px'
        } else {
            lockBtn.style.borderWidth = '3px'
        }
        if (positionDetectionConfidence > 10) {
            positionDetectionConfidence = 0;
            clearInterval(detectPositionTimer);
            console.log('Good position detected')
            lockPosition();
        }
    }


})