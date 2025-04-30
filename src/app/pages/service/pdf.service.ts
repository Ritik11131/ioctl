import { Injectable } from '@angular/core';
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from 'pdfmake/build/vfs_fonts';

(<any>pdfMake).addVirtualFileSystem(pdfFonts);

@Injectable({
  providedIn: 'root'
})
export class PdfService {

  constructor() { }

  generateOp46Certificate(): void {
    const docDefinition: any = {
      content: [
        // First Row - Header with images and text
        {
          columns: [
            {
              stack: [
                { text: '[LOGO]', style: 'logoPlaceholder', alignment: 'center' },
                { text: 'Placeholder for IOCL Logo', style: 'logoText', alignment: 'center' }
              ],
              width: 100,
              alignment: 'center'
            },
            {
              stack: [
                { text: 'Indian Oil Corporation Limited(Marketing Division)', style: 'headerText', alignment: 'center' },
                { text: 'Madhya Pradesh State Office (LPG Bulk)', style: 'headerTextSmall', alignment: 'center' },
                { text: 'Round Trip Distance(TRANSPORTATION RTD)', style: 'headerTextUnderline', alignment: 'center' }
              ],
              width: '*',
              margin: [0, 10, 0, 0]
            },
            {
              stack: [
                { text: '[LOGO]', style: 'logoPlaceholder', alignment: 'center' },
                { text: 'Placeholder for IOCL Logo', style: 'logoText', alignment: 'center' }
              ],
              width: 100,
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
                { text: 'Ref. No.: MAD-RTD/3385/Bulk/2018-19/1868', style: 'rowText', alignment: 'left', margin: [0, 2, 0, 2] },
                { text: 'Ref. No.: MAD-RTD/3385/Bulk/2018-19/1868', style: 'rowText', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'Ref. No.: MAD-RTD/3385/Bulk/2018-19/1868', style: 'rowText', alignment: 'right', margin: [0, 2, 0, 2] }
              ],
              margin: [0, 0, 0, 0]
            },
            {
              columns: [
                { text: 'Ref. No.: MAD-RTD/3385/Bulk/2018-19/1868', style: 'rowText', alignment: 'left', margin: [0, 2, 0, 2] },
                { text: 'Ref. No.: MAD-RTD/3385/Bulk/2018-19/1868', style: 'rowText', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'Ref. No.: MAD-RTD/3385/Bulk/2018-19/1868', style: 'rowText', alignment: 'right', margin: [0, 2, 0, 2] }
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
            widths: ['5%', '10%', '8%', '8%', '8%', '8%', '4%', '3%', '5%', '8%', '8%', '8%', '15%'],
            body: [
              [
                { text: 'Sr No', style: 'tableHeader', alignment: 'center', rowSpan: 2, margin: [0, 2, 0, 2] },
                { text: 'Name and Address of LPG Bulk', style: 'tableHeader', alignment: 'center', rowSpan: 2, margin: [0, 2, 0, 2] },
                { text: 'ERP Reference Code', style: 'tableHeader', alignment: 'center', rowSpan: 2, margin: [0, 2, 0, 2] },
                { text: 'Old RTD', style: 'tableHeader', alignment: 'center', colSpan: 3, margin: [0, 2, 0, 2] },
                {},
                {},
                { text: 'New RTD', style: 'tableHeader', alignment: 'center', colSpan: 6, margin: [0, 2, 0, 2] },
                {},
                {},
                {},
                {},
                {},
                { text: 'Reason for New RTD', style: 'tableHeader', alignment: 'center', rowSpan: 2, margin: [0, 2, 0, 2] }
              ],
              [
                {},
                {},
                {},
                { text: 'Total Rtd(km)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'Verification Date', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'One Way Toll Charges X 2', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'Plain(km)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'Hill(km)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'High Hill(km)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'Total Rtd(km)', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'Verification Date', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: 'One Way Toll Charges X 2', style: 'tableSubHeader', alignment: 'center', margin: [0, 2, 0, 2] },
                {}
              ],
              [
                { text: '1', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] },
                { text: '', style: 'tableCell', alignment: 'center', margin: [0, 2, 0, 2] }
              ]
            ]
          },
          margin: [0, 5, 0, 20],
          layout: {
            hLineWidth: function(i: number, node: any) { return 0.5; },
            vLineWidth: function(i: number, node: any) { return 0.5; },
            hLineColor: function(i: number, node: any) { return '#aaa'; },
            vLineColor: function(i: number, node: any) { return '#aaa'; },
            paddingLeft: function(i: number, node: any) { return 0; },
            paddingRight: function(i: number, node: any) { return 0; },
            paddingTop: function(i: number, node: any) { return 2; },
            paddingBottom: function(i: number, node: any) { return 2; }
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
            // First row - 1 box
            {
              columns: [
                {
                  stack: [
                    { text: 'Field Officer/Plant Manager/Incharge:', style: 'boxLabel' },
                    { text: 'Name : Ss Bajpai', style: 'boxContent' },
                    { text: 'Employee Code : 00024811', style: 'boxContent' },
                    { text: 'Date : 21/03/2025 02:34:26 PM', style: 'boxContent' }
                  ],
                  width: '100%',
                  height: 80,
                  style: 'box'
                }
              ],
              margin: [0, 20, 0, 10]
            },
            // Second row - 3 boxes
            {
              columns: [
                {
                  stack: [
                    { text: 'Field Officer/Plant Manager/Incharge:', style: 'boxLabel' },
                    { text: 'Name : Ss Bajpai', style: 'boxContent' },
                    { text: 'Employee Code : 00024811', style: 'boxContent' },
                    { text: 'Date : 21/03/2025 02:34:26 PM', style: 'boxContent' }
                  ],
                  width: '33%',
                  height: 80,
                  style: 'box'
                },
                {
                  stack: [
                    { text: 'Field Officer/Plant Manager/Incharge:', style: 'boxLabel' },
                    { text: 'Name : Ss Bajpai', style: 'boxContent' },
                    { text: 'Employee Code : 00024811', style: 'boxContent' },
                    { text: 'Date : 21/03/2025 02:34:26 PM', style: 'boxContent' }
                  ],
                  width: '33%',
                  height: 80,
                  style: 'box'
                },
                {
                  stack: [
                    { text: 'Field Officer/Plant Manager/Incharge:', style: 'boxLabel' },
                    { text: 'Name : Ss Bajpai', style: 'boxContent' },
                    { text: 'Employee Code : 00024811', style: 'boxContent' },
                    { text: 'Date : 21/03/2025 02:34:26 PM', style: 'boxContent' }
                  ],
                  width: '33%',
                  height: 80,
                  style: 'box'
                }
              ],
              margin: [0, 0, 0, 10]
            },
            // Third row - 1 box
            {
              columns: [
                {
                  stack: [
                    { text: 'Field Officer/Plant Manager/Incharge:', style: 'boxLabel' },
                    { text: 'Name : Ss Bajpai', style: 'boxContent' },
                    { text: 'Employee Code : 00024811', style: 'boxContent' },
                    { text: 'Date : 21/03/2025 02:34:26 PM', style: 'boxContent' }
                  ],
                  width: '100%',
                  height: 80,
                  style: 'box'
                }
              ],
              margin: [0, 0, 0, 20]
            }
          ]
        },
        // Map Image Row
        {
          stack: [
            { text: '[MAP IMAGE]', style: 'mapPlaceholder', alignment: 'center' },
            { text: 'Placeholder for Route Map', style: 'mapText', alignment: 'center' }
          ],
          width: '100%',
          height: 300,
          margin: [0, 20, 0, 20]
        },
        // Source to Destination Table
        {
          text: 'Source to Destination',
          style: 'tableHeading',
          margin: [0, 0, 0, 10]
        },
        {
          text: 'From: [Source Address]\nTo: [Destination Address]',
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
              [
                { text: '1', style: 'tableCell', alignment: 'center' },
                { text: '', style: 'tableCell', alignment: 'left' },
                { text: '', style: 'tableCell', alignment: 'right' }
              ],
              [
                { text: '2', style: 'tableCell', alignment: 'center' },
                { text: '', style: 'tableCell', alignment: 'left' },
                { text: '', style: 'tableCell', alignment: 'right' }
              ],
              [
                { text: '3', style: 'tableCell', alignment: 'center' },
                { text: '', style: 'tableCell', alignment: 'left' },
                { text: '', style: 'tableCell', alignment: 'right' }
              ],
              [
                { text: 'Total', style: 'tableHeader', alignment: 'right', colSpan: 2 },
                {},
                { text: '0.00', style: 'tableHeader', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) { return 0.5; },
            vLineWidth: function(i: number, node: any) { return 0.5; },
            hLineColor: function(i: number, node: any) { return '#aaa'; },
            vLineColor: function(i: number, node: any) { return '#aaa'; },
            paddingLeft: function(i: number, node: any) { return 5; },
            paddingRight: function(i: number, node: any) { return 5; },
            paddingTop: function(i: number, node: any) { return 2; },
            paddingBottom: function(i: number, node: any) { return 2; }
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
          text: 'From: [Destination Address]\nTo: [Source Address]',
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
              [
                { text: '1', style: 'tableCell', alignment: 'center' },
                { text: '', style: 'tableCell', alignment: 'left' },
                { text: '', style: 'tableCell', alignment: 'right' }
              ],
              [
                { text: '2', style: 'tableCell', alignment: 'center' },
                { text: '', style: 'tableCell', alignment: 'left' },
                { text: '', style: 'tableCell', alignment: 'right' }
              ],
              [
                { text: '3', style: 'tableCell', alignment: 'center' },
                { text: '', style: 'tableCell', alignment: 'left' },
                { text: '', style: 'tableCell', alignment: 'right' }
              ],
              [
                { text: 'Total', style: 'tableHeader', alignment: 'right', colSpan: 2 },
                {},
                { text: '0.00', style: 'tableHeader', alignment: 'right' }
              ]
            ]
          },
          layout: {
            hLineWidth: function(i: number, node: any) { return 0.5; },
            vLineWidth: function(i: number, node: any) { return 0.5; },
            hLineColor: function(i: number, node: any) { return '#aaa'; },
            vLineColor: function(i: number, node: any) { return '#aaa'; },
            paddingLeft: function(i: number, node: any) { return 5; },
            paddingRight: function(i: number, node: any) { return 5; },
            paddingTop: function(i: number, node: any) { return 2; },
            paddingBottom: function(i: number, node: any) { return 2; }
          },
          margin: [0, 0, 0, 20]
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
          color: 'black'
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
          fontSize: 7,
          bold: true,
          margin: [0, 0, 0, 2]
        },
        boxContent: {
          fontSize: 7,
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
        }
      },
      defaultStyle: {
        fontSize: 8
      }
    };

    // For testing purposes, show what would be created
    pdfMake.createPdf(docDefinition).download('Certificate.pdf');
  }
}
