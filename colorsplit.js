/*
Color Splitter
Copyright (c) 2022 Grace L

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/


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

images = [new Image(), new Image(), new Image()];
images[0].src = "red.jpg";
images[1].src = "green.jpg";
images[2].src = "blue.jpg";
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
	if (canvasIdx == 3)
	{
		return inputCanvases[0].offscreenCanvas.getContext('2d').createImageData(dataWidth, dataHeight).data;
	}
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
		
		// transparent if all three are transparent, basically
		data[i + 3] = red[i+3] + green[i+3] + blue[i+3];
	}

	ctx.putImageData(imageData, 0, 0);

	drawing = false;
}

for (let i = 0; i < images.length; i++)
{
	images[i].onload = function() { updateCanvas(i, images[i]); images[i].loaded = true; };
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

	// i know it's called maxOutputWidth, but it's actually just the width the canvas starts out at
	// it's fine to let the canvas get wider than the screen, the user can scroll to the side
	thisCanvas.offscreenCanvas.width = Math.max(maxOutputWidth, outputscaledWidth);
	thisCanvas.offscreenCanvas.height = maxOutputHeight;
	const offscreenImageHeight = Math.min(outputCanvas.height, sourceImage.naturalHeight);

	const hiddenContext = thisCanvas.offscreenCanvas.getContext('2d');
	hiddenContext.drawImage(sourceImage, Math.floor((thisCanvas.offscreenCanvas.width - outputscaledWidth)/2 + offsetX), Math.floor((thisCanvas.offscreenCanvas.height - offscreenImageHeight)/2 + offsetY), outputscaledWidth, offscreenImageHeight);

	const ctx = thisCanvas.getContext('2d');

	const targetHeight = Math.min(sourceImage.naturalHeight, thisCanvas.height * .40);	
	const scalefactor = Math.min(targetHeight / sourceImage.naturalHeight, 1);
	const scaledWidth = sourceImage.naturalWidth * scalefactor;
	//thisCanvas.width = scaledWidth;		

	ctx.clearRect(0, 0, thisCanvas.width, thisCanvas.height);

	ctx.drawImage(sourceImage, Math.floor((thisCanvas.width - scaledWidth)/2 + offsetX), Math.floor((thisCanvas.height - targetHeight)/2 + offsetY), scaledWidth, targetHeight);

	setTimeout(drawOutput);
}


for (let i = 0; i < 3; i++)
{
	// input1 goes to inputCanvases[0] and so on. 
	const inpo = document.getElementById("input" + (i+1));
	inpo.addEventListener('change', function (e) { 

			if (images[i] !== null && images[i].src.startsWith("blob:"))
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
	updateCanvas(i, images[i]);
}

for (const element of document.getElementsByTagName("input"))
{
	if (element.type === "radio")
	{
		element.addEventListener('change', drawOutput);
	}
}

for (let i = 0; i < images.length; i++)
{
	if (images[i].loaded === false)
		updateCanvas(i, images[i]);
}

if ('serviceWorker' in navigator) {
	    navigator.serviceWorker.register('sw.js');
};
