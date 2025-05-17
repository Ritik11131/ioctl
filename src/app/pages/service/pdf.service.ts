import { Injectable } from '@angular/core';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment.prod';
import { HttpClient } from '@angular/common/http';

(<any>pdfMake).addVirtualFileSystem(pdfFonts);

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor(private authService: AuthService, private httpClient: HttpClient) { }


  /**
 * Function to fetch the map image from the local API and convert it to a base64 string for pdfMake
 * @param sourceCoords - Source coordinates [lat, lng]
 * @param destCoords - Destination coordinates [lat, lng]
 * @param authToken - Authorization token for the API
 * @returns Promise<string> - Base64 encoded image data
 */
  async fetchMapImage(sourceCoords: number[], destCoords: number[], authToken: string | null, sourcePath: string, destinationPath: string, sourceBounds: any, tolls: any): Promise<string> {
    try {
      // Build the markers parameters
      const sourceMarker = `color:blue|label:S|${sourceCoords.join(',')}`;
      const destMarker = `color:red|label:D|${destCoords.join(',')}`;

       // Convert toll coordinates into markers
    const tollMarkers = tolls.map((toll: any) => {
      const {latitude, longitude} = toll; // assuming toll.coordinates = [lat, lng]
      return `color:yellow|label:T|${latitude},${longitude}`;
    });

      // Calculate optimal center and zoom based on provided bounds
      const bounds = this.calculateMapBounds(sourceBounds);

      // Build the URL with all parameters
      const url = new URL(environment.googleMapStaticApiURl);
      url.searchParams.append('size', '600x300');  // Larger size for better visibility
      url.searchParams.append('path', sourcePath);
      // url.searchParams.append('path', destinationPath);
      url.searchParams.append('center', bounds.center);
      url.searchParams.append('zoom', bounds.zoom);
      url.searchParams.append('maptype', 'roadmap');  // Options: roadmap, satellite, hybrid, terrain
      url.searchParams.append('markers', sourceMarker);
      url.searchParams.append('markers', destMarker);

       // Add each toll marker
    tollMarkers.forEach((marker: any) => {
      url.searchParams.append('markers', marker);
    });

    

      // Make the fetch request with authorization header if provided
      const headers: Record<string, string> = {};
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(url.toString(), { headers });

      if (!response.ok) {
        throw new Error(`Error fetching map: ${response.status} ${response.statusText}`);
      }

      // Get the response as blob
      const blob = await response.blob();

      // Convert blob to base64 for PDF
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error fetching map image:', error);
      throw error;
    }
  }

  calculateMapBounds(sourceBounds: any): { center: string, zoom: string } {
    // Calculate center from bounds
    const centerLat = (sourceBounds.north + sourceBounds.south) / 2;
    const centerLng = (sourceBounds.east + sourceBounds.west) / 2;

    // Calculate appropriate zoom level based on the distance
    const latSpan = sourceBounds.north - sourceBounds.south;
    const lngSpan = sourceBounds.east - sourceBounds.west;

    // Use the larger span to determine zoom
    const maxSpan = Math.max(latSpan, lngSpan);

    // Constants for zoom calculation (adjust as needed)
    const WORLD_DIM = { height: 256, width: 256 };
    const ZOOM_MAX = 18;

    // Calculate zoom based on the formula:
    // zoom = log2(mapDimension / worldDimension * 360 / angleSpan)
    const latZoom = Math.floor(Math.log2(600 / WORLD_DIM.height * 360 / latSpan));
    const lngZoom = Math.floor(Math.log2(400 / WORLD_DIM.width * 360 / lngSpan));

    // Use the smaller zoom level to ensure both coordinates fit
    let zoom = Math.min(latZoom, lngZoom, ZOOM_MAX);

    // Ensure reasonable zoom bounds
    zoom = Math.max(1, Math.min(zoom, 15)); // I've adjusted the max zoom to 15 for better visibility

    return {
      center: `${centerLat},${centerLng}`,
      zoom: (zoom - 1).toString()
    };
  }


  async generateOpCertificate(pdfObject: any, view: boolean): Promise<void> {
    console.log(pdfObject);
    const image1$: any = this.httpClient.get('assets/images/MargDarshak.png', { responseType: 'blob' }).toPromise();
    // Fetch the second image and convert it to base64
    const image2$: any = this.httpClient.get('assets/images/Indane.png', { responseType: 'blob' }).toPromise();
    const parseHtmlInstruction = (html: string) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');
      const textArray: any[] = [];

      doc.body.childNodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
          textArray.push({ text: node.textContent });
        } else if (node.nodeType === Node.ELEMENT_NODE) {
          const element = node as HTMLElement;
          if (element.tagName.toLowerCase() === 'b') {
            textArray.push({ text: element.textContent, bold: true });
          } else {
            textArray.push({ text: element.textContent });
          }
        }
      });

      return textArray;
    };

    const calculateTotalDistance = (distanceStr: string) => {
      return parseFloat(distanceStr.replace(' km', ''));
    };

    // Extract coordinates from pdfObject
    const sourceCoords = [
      pdfObject.StD.selected.routes[0].legs[0].start_location.lat,
      pdfObject.StD.selected.routes[0].legs[0].start_location.lng
    ];

    const destCoords = [
      pdfObject.DtoS.selected.routes[0].legs[0].start_location.lat,
      pdfObject.DtoS.selected.routes[0].legs[0].start_location.lng
    ];

    const sourcePath = `enc:${pdfObject.StD.selected.routes[0].overview_polyline}`;
    const sourceBounds = pdfObject.StD.selected.routes[0].bounds;
    const destinationPath = pdfObject.StD.selected.routes[0].overview_polyline;
    const tolls = pdfObject.tolls


    // Fetch the map image
    const mapImageBase64 = await this.fetchMapImage(sourceCoords, destCoords, this.authService.getToken(), sourcePath, destinationPath, sourceBounds, tolls);

    const totalStD = calculateTotalDistance(pdfObject.StD.selected.routes[0].legs[0].distance.text);
    const totalDtoS = calculateTotalDistance(pdfObject.DtoS.selected.routes[0].legs[0].distance.text);
    const totalCombined = totalStD + totalDtoS;


    Promise.all([image1$, image2$]).then(([blob1, blob2]) => {
      const reader1 = new FileReader();
      const reader2 = new FileReader();

      reader1.onloadend = () => {
        const base64data1 = reader1.result as string;

        reader2.onloadend = () => {
          const base64data2 = reader2.result as string;

          const docDefinition: any = {
            content: [
              // First Row - Header with images and text
              {
                columns: [
                  {
                    image: base64data1,
                    width: 50,
                    alignment: 'center'
                  },
                  {
                    stack: [
                      { text: pdfObject.rtdName || '-', style: 'headerTextSmallWithoutBold', alignment: 'center' },
                      { text: 'Indian Oil Corporation Limited(Marketing Division)', style: 'headerText', alignment: 'center' },
                      { text: `${pdfObject?.destinationDept?.name || '-'} State Office (LPG Packed)`, style: 'headerTextSmall', alignment: 'center' },
                      { text: 'Round Trip Distance(TRANSPORTATION RTD)', style: 'headerTextUnderline', alignment: 'center' }
                    ],
                    width: '*',
                    margin: [0, 10, 0, 0]
                  },
                  {
                    image: base64data2,
                    width: 50,
                    alignment: 'center'
                  }
                ],
                margin: [0, 0, 0, 20]
              },

              // Second Row - Three rows of three columns
              {
                stack: [
                  {
                    columns: [
                      { text: `Ref. No.: ${pdfObject?.destinationDept?.code || '-'}-RTD/${pdfObject.destination.exCode || '-'}/${pdfObject?.rtdFor || '-'}/2025-26/${pdfObject?.id}`, style: 'rowText', alignment: 'left', margin: [0, 2, 0, 2] },
                      { text: `Effective date of implementation: ${pdfObject.startDate || '-' } ; Valid till: ${pdfObject.endDate}`, style: 'rowText', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: `SUPPLY LOCATION : ${pdfObject?.source?.name || '-' }\nPlant Code/Location Code: ${pdfObject?.source?.exCode || '-'}`, style: 'rowText', alignment: 'right', margin: [0, 2, 0, 2] }
                    ],
                    margin: [0, 0, 0, 0]
                  },
                  {
                    columns: [
                      { text: `Sap Code: ${pdfObject.destination.exCode || '-'} `, style: 'rowText', alignment: 'left', margin: [0, 2, 0, 2] },
                      { text: `Type : LPG ${pdfObject?.rtdFor || '-'}`, style: 'rowText', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: 'Sales Area :', style: 'rowText', alignment: 'right', margin: [0, 2, 0, 2] }
                    ],
                    margin: [0, 0, 0, 0]
                  },

                ],
                margin: [0, 0, 0, 20]
              },

              // Third Row - Table
              {
                table: {
                  headerRows: 2,
                  widths: ['5%', '30%', '10%', '8%', '8%', '8%', '10%', '10%', '8%', '13%'],
                  body: [
                    [
                      { text: 'Sr No', style: 'tableHeader', alignment: 'center', rowSpan: 2, margin: [0, 2, 0, 2] },
                      { text: `Name and Address of LPG ${pdfObject?.rtdFor || '-'}`, style: 'tableHeader', alignment: 'center', rowSpan: 2, margin: [0, 2, 0, 2] },
                      { text: 'SAP Reference Code', style: 'tableHeader', alignment: 'center', rowSpan: 2, margin: [0, 2, 0, 2] },
                      { text: 'Old RTD', style: 'tableHeader', alignment: 'center', colSpan: 3, margin: [0, 2, 0, 2] }, {}, {},
                      { text: 'New RTD', style: 'tableHeader', alignment: 'center', colSpan: 3, margin: [0, 2, 0, 2] }, {}, {},
                    ],
                    [
                      {}, {}, {},
                      { text: 'Total Rtd(km)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: 'Verification Date', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: 'Toll Charges(Rs)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: 'Total Rtd(km)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: 'Verification Date', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: 'Toll Charges(Rs)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                    ],
                    [
                      { text: '1', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: `${pdfObject?.destination?.name || '-'}, ${pdfObject?.destination?.address1 || '-'}`, style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: `${pdfObject.destination.exCode || '-'}`, style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: '-', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: '-', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: '-', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: `${pdfObject.totalDistanceKm || '-'}`, style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: `${pdfObject.startDate || '-'}`, style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                      { text: `${pdfObject?.tollPrice || '-'}`, style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                    ]
                  ]
                },
                margin: [0, 0, 0, 0],
                layout: {
                  hLineWidth: function (i: number, node: any) { return 0.5; },
                  vLineWidth: function (i: number, node: any) { return 0.5; },
                  hLineColor: function (i: number, node: any) { return '#aaa'; },
                  vLineColor: function (i: number, node: any) { return '#aaa'; },
                  paddingLeft: function (i: number, node: any) { return 0; },
                  paddingRight: function (i: number, node: any) { return 0; },
                  paddingTop: function (i: number, node: any) { return 0; },
                  paddingBottom: function (i: number, node: any) { return 0; }
                }
              },


              {
                text: '1. Certified that the pricing RTD recommended for approval is through all weather shortest motorable route. Policy Applicable: HO/Indane Ops/02/2018-19; dated 09.07.2018.',
                style: 'bulletText',
                margin: [0, 20, 0, 5]
              },
              {
                text: '2. Recovery (if any) is to be effected by supply location effective from date of implementation.',
                style: 'bulletText',
                margin: [0, 0, 0, 5]
              },
              {
                text: '3. Enclosures:',
                style: 'bulletText',
                margin: [0, 0, 0, 5]
              },
              {
                text: '(i) Sketch of route map followed covering prominent landmarks/towns/ toll-booths along with point to point distances for individual Markets.',
                style: 'bulletText',
                margin: [20, 0, 0, 5]
              },
              {
                text: '(ii) Table containing point to point distance.',
                style: 'bulletText',
                margin: [20, 0, 0, 5]
              },
              {
                text: '(iii) Copy of receipts of toll charges, entry taxes, etc., if any with name of toll gates and current gazette notification of respective toll gates.',
                style: 'bulletText',
                margin: [20, 0, 0, 20]
              },
           {
  stack: [
    ...(() => {
      const commentBoxes = [];
      const comments = pdfObject?.comments || [];
      
      // Process each comment individually (one per row)
      for (let i = 0; i < comments.length; i++) {
        const comment = comments[i];
        
        commentBoxes.push({
          // Single column taking full width
          stack: [
            { text: 'Field Officer/Plant Manager/Incharge:', style: 'boxLabel' },
            { text: `Name : ${comment?.userName || '-'}`, style: 'boxContent' },
            { text: `Employee Code : ${comment?.refId || '-'}`, style: 'boxContent' },
            { text: `Comment : ${comment?.comment || '-'}`, style: 'boxContent' },
            { text: `Date : ${comment?.timestamp || '-'}`, style: 'boxContent' }
          ],
          // Style for the box with black border
          style: 'box',
          // Add explicit border and width
          margin: [0, 0, 0, 10],
          width: '100%', // Take full width
          border: [true, true, true, true], // Add borders on all sides
          borderColor: '#000000', // Black border
          borderWidth: 1,
          padding: 5
        });
      }
      
      return commentBoxes;
    })()
  ]
},

              // Map Image Row
              {
                image: mapImageBase64,
                width: 600,
                height: 300,
                alignment: 'center',
                margin: [0, 20, 0, 20]
              },

              {
                text: 'Toll Information',
                style: 'tableHeading',
                margin: [0, 0, 0, 10]
              },
              {
                table: {
                  widths: [150, 150, '*'], // Define column widths
                  headerRows: 1, // Specify number of header rows
                  body: [
                    [
                      { text: 'Toll Name', style: 'tableHeader' },
                      { text: 'Vehicle Category', style: 'tableHeader' },
                      { text: 'Document Link', style: 'tableHeader' }
                    ], // Table headers
                    ...pdfObject?.tolls?.map((toll: any) => [
                      { text: toll.name, style: 'tableCell' },
                      { text: toll.vehicleCategory,style: 'tableCell'},
                      { text: 'Click here', link: toll.gazetteDocument, color: 'blue', style: 'tableCell' }
                    ])
                  ]
                },
                margin: [0, 0, 0, 20], // Optional: Add margin around the table
                layout: {
                  hLineWidth: function (i: number, node: any) { return 0.5; },
                  vLineWidth: function (i: number, node: any) { return 0.5; },
                  hLineColor: function (i: number, node: any) { return '#aaa'; },
                  vLineColor: function (i: number, node: any) { return '#aaa'; },
                  paddingLeft: function (i: number, node: any) { return 5; }, // Add left padding
                  paddingRight: function (i: number, node: any) { return 5; }, // Add right padding
                  paddingTop: function (i: number, node: any) { return 5; }, // Add top padding
                  paddingBottom: function (i: number, node: any) { return 5; } // Add bottom padding
                }
              },


              // Source to Destination Table
              {
                text: 'Source to Destination',
                style: 'tableHeading',
                margin: [0, 0, 0, 10]
              },
              {
                text: [
                  { text: 'From: ' },
                  { text: pdfObject.StD.selected.routes[0].legs[0].start_address, bold: true },
                  { text: '\nTo: ' },
                  { text: pdfObject.StD.selected.routes[0].legs[0].end_address, bold: true }
                ],
                style: 'addressText',
                margin: [0, 0, 0, 10]
              },
              {
                table: {
                  headerRows: 1,
                  widths: ['10%', '70%', '20%'],
                  body: [
                    [
                      { text: 'Sl#', style: 'tableHeader', alignment: 'center' },
                      { text: 'Instructions', style: 'tableHeader', alignment: 'center' },
                      { text: 'Distance (km)', style: 'tableHeader', alignment: 'center' }
                    ],
                    ...pdfObject.StD.selected.routes[0].legs[0].steps
                      .filter((step: any) => step.instructions && step.instructions.trim() !== '')
                      .map((step: any, index: number) => [
                        { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
                        {
                          text: parseHtmlInstruction(step.instructions),
                          style: 'tableCell',
                          alignment: 'left',
                          margin: [2, 2, 2, 2]
                        },
                        { text: step.distance.text, style: 'tableCell', alignment: 'right' }
                      ]),
                    [
                      { text: 'Total', style: 'tableHeader', alignment: 'right', colSpan: 2 },
                      {},
                      { text: pdfObject.StD.selected.routes[0].legs[0].distance.text, style: 'tableHeader', alignment: 'right' }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: function (i: number, node: any) { return 0.5; },
                  vLineWidth: function (i: number, node: any) { return 0.5; },
                  hLineColor: function (i: number, node: any) { return '#aaa'; },
                  vLineColor: function (i: number, node: any) { return '#aaa'; },
                  paddingLeft: function (i: number, node: any) { return 2; },
                  paddingRight: function (i: number, node: any) { return 2; },
                  paddingTop: function (i: number, node: any) { return 2; },
                  paddingBottom: function (i: number, node: any) { return 2; }
                },
                margin: [0, 0, 0, 20]
              },
              // Destination to Source Table
              {
                text: 'Destination to Source',
                style: 'tableHeading',
                margin: [0, 20, 0, 10]
              },
              {
                text: [
                  { text: 'From: ' },
                  { text: pdfObject.DtoS.selected.routes[0].legs[0].start_address, bold: true },
                  { text: '\nTo: ' },
                  { text: pdfObject.DtoS.selected.routes[0].legs[0].end_address, bold: true }
                ],
                style: 'addressText',
                margin: [0, 0, 0, 10]
              },
              {
                table: {
                  headerRows: 1,
                  widths: ['10%', '70%', '20%'],
                  body: [
                    [
                      { text: 'Sl#', style: 'tableHeader', alignment: 'center' },
                      { text: 'Instructions', style: 'tableHeader', alignment: 'center' },
                      { text: 'Distance (km)', style: 'tableHeader', alignment: 'center' }
                    ],
                    ...pdfObject.DtoS.selected.routes[0].legs[0].steps
                      .filter((step: any) => step.instructions && step.instructions.trim() !== '')
                      .map((step: any, index: number) => [
                        { text: (index + 1).toString(), style: 'tableCell', alignment: 'center' },
                        {
                          text: parseHtmlInstruction(step.instructions),
                          style: 'tableCell',
                          alignment: 'left',
                          margin: [2, 2, 2, 2]
                        },
                        { text: step.distance.text, style: 'tableCell', alignment: 'right' }
                      ]),
                    [
                      { text: 'Total', style: 'tableHeader', alignment: 'right', colSpan: 2 },
                      {},
                      { text: pdfObject.DtoS.selected.routes[0].legs[0].distance.text, style: 'tableHeader', alignment: 'right' }
                    ]
                  ]
                },
                layout: {
                  hLineWidth: function (i: number, node: any) { return 0.5; },
                  vLineWidth: function (i: number, node: any) { return 0.5; },
                  hLineColor: function (i: number, node: any) { return '#aaa'; },
                  vLineColor: function (i: number, node: any) { return '#aaa'; },
                  paddingLeft: function (i: number, node: any) { return 2; },
                  paddingRight: function (i: number, node: any) { return 2; },
                  paddingTop: function (i: number, node: any) { return 2; },
                  paddingBottom: function (i: number, node: any) { return 2; }
                },
                margin: [0, 0, 0, 20]
              },
              {
                text: [
                  { text: 'Total Combined Distance: ', bold: true },
                  { text: `${totalCombined} km`, bold: true }
                ],
                style: 'totalDistance',
                margin: [0, 10, 0, 0]
              }
            ],
            styles: {
              headerText: {
                fontSize: 14,
                bold: true,
                margin: [0, 2, 0, 2]
              },
              headerTextSmall: {
                fontSize: 12,
                bold: true,
                margin: [0, 2, 0, 2]
              },
              headerTextSmallWithoutBold: {
                fontSize: 12,
                bold: false,
                margin: [0, 2, 0, 2]
              },
              headerTextUnderline: {
                fontSize: 14,
                bold: true,
                margin: [0, 2, 0, 2],
                decoration: 'underline'
              },
              rowText: {
                fontSize: 8,
                margin: [0, 5, 0, 5]
              },
              logoPlaceholder: {
                fontSize: 24,
                bold: true,
                color: '#cccccc',
                margin: [0, 0, 0, 0]
              },
              logoText: {
                fontSize: 8,
                color: '#666666',
                margin: [0, 0, 0, 0]
              },
              tableHeader: {
                bold: true,
                fontSize: 8,
                color: 'black',
                fillColor: '#f2f2f2'
              },
              tableSubHeader: {
                bold: true,
                fontSize: 7,
                color: 'black',
                fillColor: '#f2f2f2'
              },
              tableCell: {
                fontSize: 7,
                color: 'black',
                margin: [2, 2, 2, 2]
              },
              bulletText: {
                fontSize: 7,
                margin: [0, 0, 0, 0]
              },
              box: {
                border: [1, 1, 1, 1],
                borderColor: 'black',
                margin: [5, 5, 5, 5],
                padding: [5, 5, 5, 5]
              },
              boxLabel: {
                fontSize: 9,
                bold: true,
                margin: [0, 2, 0, 2]
              },
              boxContent: {
                fontSize: 8,
                margin: [0, 0, 0, 2]
              },
              mapPlaceholder: {
                fontSize: 24,
                bold: true,
                color: '#cccccc',
                margin: [0, 0, 0, 5]
              },
              mapText: {
                fontSize: 8,
                color: '#666666',
                margin: [0, 0, 0, 0]
              },
              tableHeading: {
                fontSize: 10,
                bold: true,
                alignment: 'center'
              },
              addressText: {
                fontSize: 8,
                margin: [0, 0, 0, 0]
              },
              totalDistance: {
                fontSize: 9,
                alignment: 'right',
                margin: [0, 10, 0, 0]
              }
            },
            defaultStyle: {
              fontSize: 8
            }
          };
          if(view) {
            pdfMake.createPdf(docDefinition).open();
          } else {
            pdfMake.createPdf(docDefinition).download(`OP46_${pdfObject?.rtdFor}_${pdfObject.rtdName}(${new Date().toISOString().slice(0, 19).replace('T', ' ').replace(/:/g, '-')}).pdf`);
          }
        };
        reader2.readAsDataURL(blob2); // Convert second blob to base64
      };
      reader1.readAsDataURL(blob1); // Convert first blob to base64
    });
  }
}
