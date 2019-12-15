import React from "react";
import Plot from "react-plotly.js";

import Button from "react-bootstrap/Button";
import Tabs from "react-bootstrap/Tabs";
import Tab from "react-bootstrap/Tab";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Image from "react-bootstrap/Image";
import Jumbotron from "react-bootstrap/Jumbotron";
import ListGroup from "react-bootstrap/ListGroup";

import "./App.css";
import plots from "./datamed3d.js";

class App extends React.Component {
    constructor(props) {
        super(props);

        // Event handlers (used as callback functions)
        this.handleClick = this.handleClick.bind(this);
        this.handleRelayout = this.handleRelayout.bind(this);

        // Layout generation functions
        this.get2DLayout = this.get2DLayout.bind(this);
        this.get3DLayout = this.get3DLayout.bind(this);

        // Helper functions for handleClick callback function
        this.clearLastSelectedPoint = this.clearLastSelectedPoint.bind(this);
        this.setSelectedPoint = this.setSelectedPoint.bind(this);
        this.setImageUrl = this.setImageUrl.bind(this);

        this.state = {
            data: null,
            data3d: null,
            layout: this.get2DLayout([], [], 0),
            layout3d: this.get3DLayout([], [], 0),
            config3d: {
                displayModeBar: false,
                responsive: true
            },
            // On App startup, the clicking on the plot will load an image into the left imageview
            selectedImage: "left",
            leftPoint: -1,
            leftCurve: -1,
            rightPoint: -1,
            rightCurve: -1,
            leftUrl: "https://via.placeholder.com/337x335.png?text=START",
            rightUrl: "https://via.placeholder.com/337x335.png?text=START"
        };
    }

    /**
     * Used to generate the layout(axes) of the 2D plot.
     *
     * @param  {Array} xrange - Range of x values - [MIN, MAX]
     * @param  {Array} yrange - Range of y values - [MIN, MAX]
     * @param  {Number} dataRev - Data revision number. Used by Plotly.js to determine if plot needs to be redrawn
     * @return {Object} layout2D - the 2D layout object
     */
    get2DLayout = function(xrange, yrange, dataRev) {
        var layout = {
            width: 750,
            height: 750,
            title: "2D Plot",
            hovermode: "closest",
            datarevision: dataRev,
            xaxis: { range: xrange },
            yaxis: { range: yrange }
        };

        return layout;
    };

    /**
     * Used to generate the layout(axes) of the 3D plot.
     *
     * @param  {Array} xrange - Range of x values. Must be reversed to display correctly - [MAX, MIN]
     * @param  {Array} yrange - Range of y values - [MIN, MAX]
     * @param  {Number} dataRev - Data revision number. Used by Plotly.js to determine if plot needs to be redrawn
     * @param  {Object} cameraState - OPTIONAL - used to retain camera orientation for the 3D plot. Not set on relayout or init, used by click handler
     * @return {Object} layout3D - the 3D layout object
     */
    get3DLayout = function(xrange, yrange, dataRev, cameraState = null) {
        if (cameraState === null) {
            cameraState = {
                center: { x: 0, y: 0, z: 0 },
                eye: { x: 0, y: 0.1, z: -2.5 },
                up: { x: 0, y: 1, z: 0 }
            };
        }

        var layout3D = {
            width: 750,
            height: 750,
            title: "3D Plot",
            hovermode: "closest",
            datarevision: dataRev,
            scene: {
                aspectmode: "auto",
                xaxis: { range: xrange },
                yaxis: { range: yrange },
                zaxis: { range: [] },
                camera: cameraState
            }
        };

        return layout3D;
    };

    /**
     * The handler for a Relayout event. This function is called to keep the 2D and 3D plot axes in sync.
     * This is done by preventing any direct resizing on the 3D plot, and calling this function whenever the 2D plot is resized.
     *
     * If this is being called by a resize event, eventdata will have xaxis and yaxis ranges.
     * If this is being called on initialization event or a reset-to-initial values event, eventdata will not be used, and instead
     * the App uses this.state.layout to change the range on the axes for the 3D plot by using the 2D plot axis ranges.
     *
     * Note: this function always calls get3DLayout without a camera parameter.
     * This means that this function can be called to reset the 3D plot to its default orientation.
     *
     * @param  {Object} eventdata - the data for a re-layout event
     */
    handleRelayout = function(eventdata) {
        var xrange = [eventdata["xaxis.range[1]"], eventdata["xaxis.range[0]"]];
        var yrange = [eventdata["yaxis.range[0]"], eventdata["yaxis.range[1]"]];

        // If no range from the event handler, get it from state
        var layoutXRange = this.state.layout.xaxis.range;

        if (xrange[0] == null) xrange = [layoutXRange[1], layoutXRange[0]];
        if (yrange[0] == null) yrange = this.state.layout.yaxis.range;

        var newRevNumber = this.state.layout3d.datarevision + 1;

        this.setState({
            layout3d: this.get3DLayout(xrange, yrange, newRevNumber)
        });
    };

    /**
     * Clears the highlight surrounding the last selected point for a given imageview. This is done to make sure that when a new point on the plot is selected,
     * the last point you selected is no longer highlighted. This way, a selected point is always associated with a displayed image.
     *
     * This is done by setting the highlight of the point to match the color of the point. Every point ALWAYS has a highlight,
     * but when it is not selected, the highlight matches the rest of the point so it is not visible.
     *
     * This function does not return anything, but it does update the stateData of the currentStateObject that is passed in. If no points have been selected yet,
     * there is no last selected point (represented by leftCurve/leftPoint or rightCurve/rightPoint being -1), so this function returns without doing anything.
     *
     * @param  {String} selectedImage - either "left" for the left image, or "right" for the right image
     * @param  {Object} currentStateObject - object that contains the current state. This is passed in so the App avoids directly retrieving state from multiple functions
     */
    clearLastSelectedPoint = function(selectedImage, currentStateObject) {
        if (selectedImage === "left" && currentStateObject.leftCurve !== -1 && currentStateObject.leftPoint !== -1) {
            currentStateObject.stateData[currentStateObject.leftCurve].marker.line.color[currentStateObject.leftPoint] =
                currentStateObject.stateData[currentStateObject.leftCurve].marker.color[currentStateObject.leftPoint];
            currentStateObject.stateData[currentStateObject.leftCurve].marker.size[currentStateObject.leftPoint] = 8;
        } else if (selectedImage === "right" && currentStateObject.rightCurve !== -1 && currentStateObject.rightPoint !== -1) {
            currentStateObject.stateData[currentStateObject.rightCurve].marker.line.color[currentStateObject.rightPoint] =
                currentStateObject.stateData[currentStateObject.rightCurve].marker.color[currentStateObject.rightPoint];
            currentStateObject.stateData[currentStateObject.rightCurve].marker.size[currentStateObject.rightPoint] = 8;
        }
    };

    /**
     * Sets the values of the selected plot/curve and the selected point for a given imageview.
     *
     * This function does not return anything, but it does update the stateData of the currentStateObject that is passed in.
     *
     * @param  {String} selectedImage - either "left" for the left image, or "right" for the right image
     * @param  {Number} curveNumber - the curve, or plot, number of the selected point
     * @param  {Number} pointNumber - the index of the selected point in it's plot/curve
     * @param  {Object} currentStateObject - object that contains the current state. This is passed in so the App avoids directly retrieving state from multiple functions
     */
    setSelectedPoint = function(selectedImage, curveNumber, pointNumber, currentStateObject) {
        if (selectedImage === "left") {
            currentStateObject.leftCurve = curveNumber;
            currentStateObject.leftPoint = pointNumber;
            currentStateObject.stateData[curveNumber].marker.line.color[pointNumber] = "#1496BB"; // Point is highlighted blue for left image
            currentStateObject.stateData[curveNumber].marker.size[pointNumber] = 18; // Increase size of selected point
        } else if (selectedImage === "right") {
            currentStateObject.rightCurve = curveNumber;
            currentStateObject.rightPoint = pointNumber;
            currentStateObject.stateData[curveNumber].marker.line.color[pointNumber] = "#000000"; // Point is highlighed black for right image
            currentStateObject.stateData[curveNumber].marker.size[pointNumber] = 18; // Increase size of selected point
        } else {
            alert("Could not select a point!");
        }
    };

    /**
     * Sets the left or right imageview to contain the URL for the image associated with the selected point.
     *
     * This function does not return anything, but it does update the stateData of the currentStateObject that is passed in.
     *
     * NOTE: this currently fetches from a local URL, but this function could be easily modified to make a request to an API.
     *
     * @param  {String} selectedImage - either "left" for the left image, or "right" for the right image
     * @param  {String} img - name of the image associated with the selected point, e.x. "234.png"
     * @param  {Object} currentStateObject - object that contains the current state. This is passed in so the App avoids directly retrieving state from multiple functions
     */
    setImageUrl = function(selectedImage, img, currentStateObject) {
        if (selectedImage === "left") currentStateObject.leftUrl = process.env.PUBLIC_URL + "/img/" + img;
        else if (selectedImage === "right") currentStateObject.rightUrl = process.env.PUBLIC_URL + "/img/" + img;
        else alert("Could not set an image!");
    };

    /**
     * The handler for a Click event. This is triggered when a user selects a point on either the 2D or 3D plot. This handler is used for both the 2D and 3D plots
     * because the data used to generate each plot is exactly the same, with the only difference being that there is an extra dimension for the 3D plot.
     *
     * Even though there is another dimension, the 2D and 3D plots have the same number of points so they have been designed to share a data object. As a result of this,
     * any changes to one plot are reflected in the other plot - clicking a point on the 2D plot will highlight the corresponding point on the 3D plot,
     * and vice versa.
     *
     * @param  {Object} data - data from Plotly click event. Contains information related to the point that was clicked on
     * @param  {Array} data.points - Array of selected points. In this implementation, only one point can be selected at a time
     * @param  {Number} data.points[0].curveNumber - the curve, or plot, number of the selected point
     * @param  {Number} data.points[0].pointNumber - the index of the selected point in it's plot/curve
     * @param  {String} data.points[0].data.imgURLs[pointNumber] - name of the image associated with the selected point, e.x. "234.png"
     */
    handleClick = function(data) {
        // Snapshot of the current state that gets passed in to helper functions that modify it. Entitire object is then used to update this.state afterwards.
        var currentStateObject = {
            leftCurve: this.state.leftCurve,
            leftPoint: this.state.leftPoint,
            rightCurve: this.state.rightCurve,
            rightPoint: this.state.rightPoint,
            leftUrl: this.state.leftUrl,
            rightUrl: this.state.rightUrl,
            stateData: this.state.data
        };

        var curveNumber = data.points[0].curveNumber;
        var pointNumber = data.points[0].pointNumber;

        // If point is already selected, do not allow it to be selected again
        if (
            (curveNumber === currentStateObject.leftCurve && pointNumber === currentStateObject.leftPoint) ||
            (curveNumber === currentStateObject.rightCurve && pointNumber === currentStateObject.rightPoint)
        ) {
            return;
        }

        // Either "right" or "left", depending on which button was clicked before clicking on the plot
        var selectedImage = this.state.selectedImage;

        // Clear the highlight from the last point on the curve that was selected
        this.clearLastSelectedPoint(selectedImage, currentStateObject);

        // Update the currentStateObject to store the selected point, and highlight it
        this.setSelectedPoint(selectedImage, curveNumber, pointNumber, currentStateObject);

        // Update the currentStateObject to store the URL of the image associated with the selected point
        var img = data.points[0].data.imgURLs[pointNumber];
        this.setImageUrl(selectedImage, img, currentStateObject);

        // Retain axes range and increment datarevision numbers
        var xrange = this.state.layout.xaxis.range;
        var yrange = this.state.layout.yaxis.range;
        var xrangeFlipped = [xrange[1], xrange[0]]; //needed to preserve orientation in 3D plot
        var newRevNumber = this.state.layout.datarevision + 1;
        var newRevNumber3d = this.state.layout3d.datarevision + 1;
        var cameraState = this.state.layout3d.scene.camera;

        // Use the updated currentStateObject to set this.state, also update revision numbers in the layout objects so Plotly.js renders changes to state
        this.setState({
            leftUrl: currentStateObject.leftUrl,
            rightUrl: currentStateObject.rightUrl,
            layout: this.get2DLayout(xrange, yrange, newRevNumber),
            layout3d: this.get3DLayout(xrangeFlipped, yrange, newRevNumber3d, cameraState),
            leftPoint: currentStateObject.leftPoint,
            leftCurve: currentStateObject.leftCurve,
            rightPoint: currentStateObject.rightPoint,
            rightCurve: currentStateObject.rightCurve
        });
    };

    /**
     * Function that is called when the application loads.
     * NOTE: this currently loads `plots` as a javascript object from a local file called datamed3d.js - it would be relatively simple to modify this file to make a request to
     * an API, and parse the JSON response from that API into a javascript object instead.
     */
    componentDidMount() {
        // Use as many colors as data curves you are plotting. In this dataset, I only have 4 curves, so I only need 4 colors.
        const colors = ["#FF002B", "#32CD32", "#FFCB47"];
        var data = [];
        var data3d = [];

        // For each Data Curve (e.x. each index in the plots array), generate a plot object, push to data array.
        for (var i = 0; i < plots.length; i++) {
            //build array for color of each point manually
            var numberOfPoints = plots[i].x.length;
            var markerColor = [];
            var lineColor = [];
            var markerSize = [];

            // For each point in this Data Curve, add an element representing it in markerColor, lineColor, and markerSize arrays.
            for (var j = 0; j < numberOfPoints; j++) {
                markerColor.push(colors[i]);
                lineColor.push(colors[i]);
                markerSize.push(8);
            }

            /**
             * This is a shared marker decorator between both the 2D and 3D plots.
             * Since it is shared, changes made to makerSize, markerColor, or lineColor in the 2D plot will update the 3D plot,
             * and vice versa.
             */
            var markerGlobal = {
                size: markerSize,
                color: markerColor,
                opacity: 1,
                line: {
                    color: lineColor,
                    width: 4
                }
            };

            /**
             * The data for the 2D and 3D plots.
             * NOTE: even though the App is displaying 2 separate plots, they share data points!
             * NOTE: the x/y/z values in `plots` are already javascript arrays, so for each plot they can simply be plugged in without parsing.
             */
            var plot = {
                x: plots[i].x,
                y: plots[i].y,
                z: plots[i].z,
                imgURLs: plots[i].imgURLs,
                name: plots[i].name,
                marker: markerGlobal,
                mode: "markers",
                type: "scatter",
                hoverinfo: "x+y"
            };
            var plot3d = {
                x: plots[i].x,
                y: plots[i].y,
                z: plots[i].z,
                imgURLs: plots[i].imgURLs,
                name: plots[i].name,
                marker: markerGlobal,
                mode: "markers",
                type: "scatter3d",
                hoverinfo: "x+y+z"
            };

            data.push(plot);
            data3d.push(plot3d);
        }
        this.setState({
            data: data,
            data3d: data3d
        });
    }

    /**
     * Function that generates the HTML view for the app. Whenever anything within a {curly brace} is called(a function) or changes(a variable),
     * this is called by the React.js framework to re-render the app.
     */
    render() {
        var leftStyle = this.state.selectedImage === "left" ? "primary" : "outline-primary";
        var rightStyle = this.state.selectedImage === "right" ? "secondary" : "outline-secondary";

        return (
            <div className="UI">
                <link
                    rel="stylesheet"
                    href="https://maxcdn.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css"
                    integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS"
                    crossOrigin="anonymous"
                />
                <Container fluid={true}>
                    <Row className="justify-content-center">
                        <h1>Data Visualization with React.js and Plotly.js</h1>
                    </Row>
                    <Row>
                        <hr style={{ height: 5 }} />
                    </Row>
                    <Row className="justify-content-md-around">
                        <Col md="auto">
                            <div className="Plot">
                                <Tabs defaultActiveKey="2D" id="plotly-tab">
                                    <Tab eventKey="2D" title="2D Plot">
                                        <Plot
                                            data={this.state.data}
                                            layout={this.state.layout}
                                            onClick={this.handleClick}
                                            onRelayout={this.handleRelayout} // sets the 3D axes on doubleClick and zoom events
                                            onInitialized={this.handleRelayout} // sets the 3D axes on App startup
                                        />
                                    </Tab>
                                    <Tab eventKey="3D" title="3D Plot">
                                        <Plot
                                            data={this.state.data3d}
                                            layout={this.state.layout3d}
                                            onClick={this.handleClick}
                                            config={this.state.config3d}
                                        />
                                    </Tab>
                                </Tabs>
                            </div>
                        </Col>
                        <Col md={{ offset: 0.3 }}>
                            <Row>
                                <Jumbotron>
                                    <ListGroup>
                                        <ListGroup.Item>
                                            Click on a button and click on any point on the plot to load its corresponding image.
                                        </ListGroup.Item>
                                        <ListGroup.Item>
                                            Click and drag on the 2D plot to zoom in, <b>double click to zoom back out.</b>
                                        </ListGroup.Item>
                                        <ListGroup.Item>Switch between 2D and 3D plots with the tabs in the upper left.</ListGroup.Item>
                                        <ListGroup.Item>Click on the legend to toggle which data curves are visible.</ListGroup.Item>
                                    </ListGroup>
                                    <Button variant="info" onClick={this.handleRelayout}>
                                        Reset 3D Plot Orientation
                                    </Button>
                                </Jumbotron>
                            </Row>
                            <Row>
                                <Col md="auto">
                                    <Row>
                                        <Button block variant={leftStyle} onClick={() => this.setState({ selectedImage: "left" })}>
                                            Click, then select a point
                                        </Button>
                                    </Row>
                                    <Row className="justify-content-md-center">
                                        <Image src={this.state.leftUrl} rounded />
                                    </Row>
                                </Col>
                                <Col md="auto" />
                                <Col md="auto">
                                    <Row>
                                        <Button block variant={rightStyle} onClick={() => this.setState({ selectedImage: "right" })}>
                                            Click, then select a point
                                        </Button>
                                    </Row>
                                    <Row className="justify-content-md-center">
                                        <Image src={this.state.rightUrl} rounded />
                                    </Row>
                                </Col>
                            </Row>
                        </Col>
                    </Row>
                </Container>
            </div>
        );
    }
}

export default App;
