const inputCanvases = [1, 2, 3].map(function(x) {
		const thisCanvas = document.getElementById("canvas" + x);
		thisCanvas.height = screen.height/4;
		thisCanvas.width = screen.width/3;
		return thisCanvas;
	});

const outputCanvas = document.getElementById("output");
outputCanvas.height = screen.height - 5;
outputCanvas.width = screen.width * (2/3);

const inputImages = [null, null, null];

function updateCanvas(canvasIdx, e)
{
	const pickedFile = e.target.files[0];
	var sourceImage = new Image();
	sourceImage.src = URL.createObjectURL(pickedFile);
	inputImages[canvasIdx] = sourceImage;
	
	sourceImage.onload = function() {
		const thisCanvas = inputCanvases[canvasIdx];
		var ctx = thisCanvas.getContext('2d');
		const scalefactor = thisCanvas.height / sourceImage.naturalHeight;
		const clampedscale = scalefactor > 1 ? 1 : scalefactor;
		const scaledWidth = sourceImage.naturalWidth * clampedscale;
		thisCanvas.width = scaledWidth;		
		
		ctx.drawImage(sourceImage, 0, 0, scaledWidth, thisCanvas.height);
	}
}

for (let i = 0; i < 3; i++)
{
	// input1 goes to inputCanvases[0] and so on. 
	document.getElementById("input" + (i+1)).addEventListener('change', updateCanvas.bind(null, i));
}

