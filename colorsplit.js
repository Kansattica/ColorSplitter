const [availableHeight, availableWidth] = function() {
		const rootHtml = document.getElementsByTagName("html")[0];
		return [rootHtml.clientHeight, rootHtml.clientWidth];
	}();


function mouseDown(e)
{
	const canvas = e.target;
	if (canvas.dragInfo === undefined)
	{
		canvas.dragInfo = { dragged: true, startx: e.clientX - canvas.offsetLeft, starty: e.clientY - canvas.offsetTop };
	}
	else
	{
		canvas.dragInfo.dragged = true;
	}
	canvas.dragInfo.x = e.clientX - canvas.offsetLeft;
	canvas.dragInfo.y = e.clientY - canvas.offsetTop;
}

images = [null, null, null];
function mouseMove(canvasIdx, e)
{
	const canvas = e.target;
	if (canvas.dragInfo !== undefined && canvas.dragInfo.dragged)
	{
		canvas.dragInfo.x = e.clientX - canvas.offsetLeft;
		canvas.dragInfo.y = e.clientY - canvas.offsetTop;

		setTimeout(updateCanvas, 0, canvasIdx, images[canvasIdx]);
	}
}

function mouseUp(e)
{
	e.target.dragInfo.dragged = false;
}

const inputCanvases = [1, 2, 3].map(function(x) {
		const thisCanvas = document.getElementById("canvas" + x);
		thisCanvas.height = availableHeight/4;
		thisCanvas.width = availableWidth/3;
		thisCanvas.addEventListener("mousedown", mouseDown);
		thisCanvas.addEventListener("mousemove", mouseMove.bind(null, x - 1));
		thisCanvas.addEventListener("mouseup", mouseUp);
		return thisCanvas;
	});

const outputCanvas = document.getElementById("output");
const maxOutputHeight = availableHeight - 30;
const maxOutputWidth = availableWidth/2;
outputCanvas.height = maxOutputHeight;
outputCanvas.width = maxOutputWidth;

function getImageForChannel(inputName, dataWidth, dataHeight)
{
	// subtract 1 because a selection of 1 corresponds to inputCanvases[0]
	const canvasIdx = parseInt(Array.from(document.getElementsByName(inputName)).filter(function (x) { return x.checked })[0].value) - 1;
	return inputCanvases[canvasIdx].offscreenCanvas.getContext('2d').getImageData(0, 0, dataWidth, dataHeight).data;
}


let drawing = false;
function drawOutput()
{
	if (inputCanvases.some(function(x) { return x.offscreenCanvas === undefined })) { return; }
	const widestInput = inputCanvases.reduce(function (prev, cur) { return cur.offscreenCanvas.width > prev ? cur.offscreenCanvas.width : prev }, 0)
	const tallestInput = inputCanvases.reduce(function (prev, cur) { return cur.offscreenCanvas.height > prev ? cur.offscreenCanvas.height : prev }, 0)

	if (drawing) return;
	drawing = true;

	const red = getImageForChannel("redchannel", widestInput, tallestInput);
	const green = getImageForChannel("greenchannel", widestInput, tallestInput);
	const blue = getImageForChannel("bluechannel", widestInput, tallestInput);
	outputCanvas.width = widestInput;
	outputCanvas.height = tallestInput;
	const ctx = outputCanvas.getContext('2d');
	const imageData = ctx.createImageData(widestInput, tallestInput);
	const data = imageData.data;

	for (let i = 0; i < data.length; i += 4)
	{
		data[i] = red[i];
		data[i + 1] = green[i + 1];
		data[i + 2] = blue[i + 2];
		data[i + 3] = 255;
	}

	ctx.putImageData(imageData, 0, 0);

	drawing = false;
}

function updateCanvas(canvasIdx, sourceImage)
{
	if (sourceImage === null) { return; }
	const thisCanvas = inputCanvases[canvasIdx];
	thisCanvas.offscreenCanvas = document.createElement('canvas');

	let offsetX = 0, offsetY = 0;
	if (thisCanvas.dragInfo)
	{
		offsetX = thisCanvas.dragInfo.x - thisCanvas.dragInfo.startx;
		offsetY = thisCanvas.dragInfo.y - thisCanvas.dragInfo.starty;
	}

	const outputscalefactor = Math.min(maxOutputHeight / sourceImage.naturalHeight, 1);
	const outputscaledWidth = sourceImage.naturalWidth * outputscalefactor;

	thisCanvas.offscreenCanvas.width = outputscaledWidth;
	thisCanvas.offscreenCanvas.height = outputCanvas.height;

	const hiddenContext = thisCanvas.offscreenCanvas.getContext('2d');
	hiddenContext.drawImage(sourceImage, offsetX, offsetY, outputscaledWidth, outputCanvas.height);

	const ctx = thisCanvas.getContext('2d');

	const targetHeight = thisCanvas.height * .40;	
	const scalefactor = Math.min(targetHeight / sourceImage.naturalHeight, 1);
	const scaledWidth = sourceImage.naturalWidth * scalefactor;
	//thisCanvas.width = scaledWidth;		

	ctx.clearRect(0, 0, thisCanvas.width, thisCanvas.height);

	ctx.drawImage(sourceImage, (thisCanvas.width - scaledWidth)/2 + offsetX, (thisCanvas.height - targetHeight)/2 + offsetY, scaledWidth, targetHeight);

	setTimeout(drawOutput);
}


for (let i = 0; i < 3; i++)
{
	// input1 goes to inputCanvases[0] and so on. 
	const inpo = document.getElementById("input" + (i+1));
	inpo.addEventListener('change', function (e) { 

			if (images[i] !== null)
			{
				URL.revokeObjectURL(images[i].src);
			}
			const pickedFile = e.target.files[0];
			if (pickedFile === undefined)
				return;
			const sourceImage = new Image();
			sourceImage.src = URL.createObjectURL(pickedFile);
			images[i] = sourceImage;
			sourceImage.onload = function() {
				setTimeout(updateCanvas, 0, i, sourceImage);
			};
		 }); 
	if (inpo.value !== "")
	{
		updateCanvas(i, images[i]);
	}
}

for (const element of document.getElementsByTagName("input"))
{
	if (element.type === "radio")
	{
		element.addEventListener('change', drawOutput);
	}
}
