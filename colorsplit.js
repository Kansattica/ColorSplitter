const [availableHeight, availableWidth] = function() {
		const rootHtml = document.getElementsByTagName("html")[0];
		return [rootHtml.clientHeight, rootHtml.clientWidth];
	}();

const inputCanvases = [1, 2, 3].map(function(x) {
		const thisCanvas = document.getElementById("canvas" + x);
		thisCanvas.height = availableHeight/4;
		thisCanvas.width = availableWidth/3;
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


function updateCanvas(canvasIdx, e)
{
	const pickedFile = e.target.files[0];
	var sourceImage = new Image();
	sourceImage.src = URL.createObjectURL(pickedFile);
	
	sourceImage.onload = function() {
		const thisCanvas = inputCanvases[canvasIdx];
		thisCanvas.offscreenCanvas = document.createElement('canvas');
		
		const outputscalefactor = Math.min(maxOutputHeight / sourceImage.naturalHeight, 1);
		const outputscaledWidth = sourceImage.naturalWidth * outputscalefactor;

		thisCanvas.offscreenCanvas.width = outputscaledWidth;
		thisCanvas.offscreenCanvas.height = outputCanvas.height;

		thisCanvas.offscreenCanvas.getContext('2d').drawImage(sourceImage, 0, 0, outputscaledWidth, outputCanvas.height);
		
		var ctx = thisCanvas.getContext('2d', {alpha: false});
		
		const scalefactor = Math.min(thisCanvas.height / sourceImage.naturalHeight, 1);
		const scaledWidth = sourceImage.naturalWidth * scalefactor;
		thisCanvas.width = scaledWidth;		
		
		ctx.drawImage(sourceImage, 0, 0, scaledWidth, thisCanvas.height);

		URL.revokeObjectURL(sourceImage.src);
		
		setTimeout(drawOutput);
	}
}


for (let i = 0; i < 3; i++)
{
	// input1 goes to inputCanvases[0] and so on. 
	const inpo = document.getElementById("input" + (i+1));
	inpo.addEventListener('change', updateCanvas.bind(null, i));
	if (inpo.value !== null)
	{
		e = {target: inpo};
		updateCanvas(i, e);
	}
}

for (const element of document.getElementsByTagName("input"))
{
	if (element.type === "radio")
	{
		element.addEventListener('change', drawOutput);
	}
}
