import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Stage, Layer, Image, Rect, Transformer } from 'react-konva';
import Konva from 'konva';

function ImageEditor() {
    const [file, setFile] = useState(null);
    const [image, setImage] = useState(null);
    const [stageSize, setStageSize] = useState({ width: 500, height: 500 });
    const [selectedId, selectShape] = useState(null);
    const [rectangles, setRectangles] = useState([]);
    const [newWidth, setNewWidth] = useState(500);
    const [newHeight, setNewHeight] = useState(500);
    const imageRef = useRef();
    const stageRef = useRef();
    const transformerRef = useRef();

    const handleSubmit = async event => {
        event.preventDefault();
    
        let operation;
        let params = {};
        if (rectangles.length > 0) {
            operation = 'crop';
            const rect = rectangles[0];
            params = { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
        } else {
            operation = 'resize';
            params = { width: newWidth, height: newHeight };
        }
    
        const formData = new FormData();
        formData.append('image', file);
        formData.append('operation', operation);
        for (const key in params) {
            formData.append(key, params[key]);
        }
    
        try {
            const response = await axios.post('http://localhost:8000/editor/edit-image', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            const newImage = new window.Image();
            newImage.onload = () => {
                imageRef.current.getLayer().batchDraw();
            };
            newImage.src = `data:image/png;base64,${response.data.image}`;
            setImage(newImage);
        } catch (error) {
            console.error('Error editing image:', error);
        }
    };
    

    useEffect(() => {
        if (imageRef.current) {
            const stage = imageRef.current.getStage();
            setStageSize({
                width: stage.width(),
                height: stage.height(),
            });
        }
    }, [imageRef.current]);

    const cropImage = () => {
        const stage = stageRef.current.getStage();
        const rect = new Konva.Rect({
            x: 20,
            y: 20,
            width: 100,
            height: 100,
            fill: 'rgba(0,0,0,0.5)',
            draggable: true,
            id: '1',
        });
        setRectangles([rect]);
        selectShape('1');
    };

    const resizeImage = () => {
        setRectangles([]);
        selectShape(null);
    };

    const handleStageMouseDown = event => {
        if (event.target === event.target.getStage()) {
            selectShape(null);
            return;
        }
        const clickedOnTransformer =
            event.target.getParent().className === 'Transformer';
        if (clickedOnTransformer) {
            return;
        }

        const id = event.target.attrs.id;
        selectShape(id);
    };

    const downloadImage = () => {
        const dataUrl = imageRef.current.toDataURL();
        const link = document.createElement('a');
        link.download = 'image.png';
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="file" onChange={e => setFile(e.target.files[0])} />
                <button type="submit">Submit</button>
                <button onClick={cropImage}>Crop</button>
                <button onClick={resizeImage}>Resize</button>
                <input type="number" value={newWidth} onChange={e => setNewWidth(parseInt(e.target.value))} placeholder="New Width" />
                <input type="number" value={newHeight} onChange={e => setNewHeight(parseInt(e.target.value))} placeholder="New Height" />
                <button onClick={downloadImage}>Download</button>
            </form>
            <Stage width={stageSize.width} height={stageSize.height} onMouseDown={handleStageMouseDown} ref={stageRef}>
                <Layer>
                    <Image image={image} ref={imageRef} />
                    {rectangles.map((rect, i) => (
                        <React.Fragment key={i}>
                            <Rect
                                {...rect}
                                draggable
                                onDragEnd={e => {
                                    const rects = rectangles.slice();
                                    rects[i] = e.target.attrs;
                                    setRectangles(rects);
                                }}
                                onTransformEnd={e => {
                                    const rects = rectangles.slice();
                                    rects[i] = e.target.attrs;
                                    setRectangles(rects);
                                }}
                            />
                            {rect.id === selectedId && <Transformer ref={transformerRef} />}
                        </React.Fragment>
                    ))}
                </Layer>
            </Stage>
        </div>
    );
}

export default ImageEditor;
