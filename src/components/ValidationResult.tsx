import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';

interface ValidationData {
  elevatorPitch: string[];
  competitors: string[];
  majorRisk: string;
  marketSize?: string;
  userPersonas?: string[];
  gtmChannels?: string[];
  nextMilestones?: string[];
  reasoning?: string;
  sources?: string[];
}

interface ValidationResultProps {
  data: ValidationData;
  selectedModel: 'sonar-reasoning' | 'sonar-deep-research' | 'sonar';
}

export const ValidationResult = ({ data, selectedModel }: ValidationResultProps) => {
  const exportToPDF = () => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 25;
    const maxWidth = pageWidth - 2 * margin;
    let yPosition = 40;
    let pageNumber = 1;

    // Color palette
    const colors = {
      primary: [41, 98, 255], // Blue
      secondary: [99, 102, 241], // Indigo
      success: [34, 197, 94], // Green
      warning: [251, 146, 60], // Orange
      danger: [239, 68, 68], // Red
      gray: [107, 114, 128], // Gray
      lightGray: [243, 244, 246], // Light Gray
      black: [0, 0, 0]
    };

    // Helper function to check if we need a new page
    const checkNewPage = (requiredSpace: number = 20) => {
      if (yPosition + requiredSpace > pageHeight - 60) {
        addFooter();
        pdf.addPage();
        pageNumber++;
        addHeader();
        yPosition = 60;
        return true;
      }
      return false;
    };

    // Helper function to add header
    const addHeader = () => {
      if (pageNumber > 1) {
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
        pdf.text('Venture Scout - Startup Validation Report', margin, 20);
        
        // Add a subtle line under header
        pdf.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
        pdf.setLineWidth(0.5);
        pdf.line(margin, 25, pageWidth - margin, 25);
      }
    };

    // Helper function to add footer with page numbers
    const addFooter = () => {
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      // Footer line
      pdf.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
      pdf.setLineWidth(0.5);
      pdf.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      // Footer text
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
      pdf.text(`Generated on ${currentDate} by Venture Scout Bot`, margin, pageHeight - 15);
      
      // Page number
      pdf.text(`Page ${pageNumber}`, pageWidth - margin - 20, pageHeight - 15);
      pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]); // Reset to black
    };

    // Helper function to add section with background
    const addSectionHeader = (title: string, color: number[]) => {
      checkNewPage(20);
      
      // Section background
      pdf.setFillColor(color[0], color[1], color[2], 0.1);
      pdf.rect(margin - 5, yPosition - 3, maxWidth + 10, 16, 'F');
      
      // Section title
      pdf.setFontSize(13);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(color[0], color[1], color[2]);
      pdf.text(title, margin, yPosition + 8);
      
      yPosition += 18;
      pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
    };

    // Helper function to add text with better formatting
    const addText = (text: string, fontSize: number = 11, isBold: boolean = false, indent: number = 0, color: number[] = colors.black) => {
      pdf.setFontSize(fontSize);
      pdf.setFont(undefined, isBold ? 'bold' : 'normal');
      pdf.setTextColor(color[0], color[1], color[2]);
      
      const lines = pdf.splitTextToSize(text, maxWidth - indent);
      const lineHeight = fontSize * 0.6;
      
      checkNewPage(lines.length * lineHeight + 5);
      
      pdf.text(lines, margin + indent, yPosition);
      yPosition += lines.length * lineHeight + 3;
    };

    // Helper function to add bullet points with better styling
    const addBulletPoint = (text: string, index: number, color: number[] = colors.primary) => {
      checkNewPage(12);
      
      // Bullet circle
      pdf.setFillColor(color[0], color[1], color[2]);
      pdf.circle(margin + 4, yPosition - 1, 1.5, 'F');
      
      // Number in circle
      pdf.setFontSize(7);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(255, 255, 255);
      pdf.text(index.toString(), margin + 2.5, yPosition + 1);
      
      // Bullet text
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
      const lines = pdf.splitTextToSize(text, maxWidth - 15);
      pdf.text(lines, margin + 12, yPosition);
      
      yPosition += lines.length * 6 + 5;
    };

    // Helper function to add spacing
    const addSpacing = (space: number = 8) => {
      yPosition += space;
    };

    // Create cover page
    pdf.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    pdf.rect(0, 0, pageWidth, 80, 'F');
    
    // Title
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('STARTUP IDEA', pageWidth / 2, 35, { align: 'center' });
    pdf.text('VALIDATION REPORT', pageWidth / 2, 50, { align: 'center' });
    
    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'normal');
    pdf.text('Generated by Venture Scout Bot', pageWidth / 2, 65, { align: 'center' });
    
    yPosition = 100;
    
    // Report summary box
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    pdf.rect(margin, yPosition, maxWidth, 60, 'FD');
    
    pdf.setFontSize(14);
    pdf.setFont(undefined, 'bold');
    pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
    pdf.text('EXECUTIVE SUMMARY', margin + 10, yPosition + 15);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
    
    const summaryText = `This report provides a comprehensive analysis of your startup idea including market validation, competitive landscape, risk assessment${selectedModel === 'sonar-deep-research' ? ', market sizing, user personas, and go-to-market strategies' : ''}.`;
    const summaryLines = pdf.splitTextToSize(summaryText, maxWidth - 20);
    pdf.text(summaryLines, margin + 10, yPosition + 30);
    
    const reportDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    pdf.text(`Report Date: ${reportDate}`, margin + 10, yPosition + 50);
    
    yPosition += 80;
    addSpacing(20);

    // Table of Contents
    addSectionHeader('TABLE OF CONTENTS', colors.secondary);
    const sections = [
      '1. Elevator Pitch',
      '2. Competitive Analysis', 
      '3. Risk Assessment'
    ];
    
    if (selectedModel === 'sonar-deep-research') {
      if (data.marketSize) sections.push('4. Market Size Analysis');
      if (data.userPersonas?.length) sections.push('5. User Personas');
      if (data.gtmChannels?.length) sections.push('6. Go-to-Market Channels');
      if (data.nextMilestones?.length) sections.push('7. Next Milestones');
    }
    
    if (data.reasoning) sections.push(`${sections.length + 1}. AI Analysis Reasoning`);
    if (data.sources?.length) sections.push(`${sections.length + 1}. Research Sources`);
    
    sections.forEach(section => {
      addText(section, 10, false, 10, colors.gray);
    });
    
    // Start new page for content
    addFooter();
    pdf.addPage();
    pageNumber++;
    addHeader();
    yPosition = 50;

    // 1. Elevator Pitch
    addSectionHeader('ELEVATOR PITCH', colors.primary);
    addText('Key value propositions and market positioning:', 9, false, 0, colors.gray);
    addSpacing(5);
    
    data.elevatorPitch?.forEach((point, index) => {
      addBulletPoint(point, index + 1, colors.primary);
    });
    addSpacing(8);

    // 2. Competitive Analysis
    addSectionHeader('COMPETITIVE LANDSCAPE', colors.success);
    addText('Main competitors and market players:', 9, false, 0, colors.gray);
    addSpacing(5);
    
    data.competitors?.forEach((competitor, index) => {
      addBulletPoint(competitor, index + 1, colors.success);
    });
    addSpacing(8);

    // 3. Risk Assessment
    addSectionHeader('MAJOR RISK ASSESSMENT', colors.warning);
    addText('Primary challenges and mitigation strategies:', 9, false, 0, colors.gray);
    addSpacing(5);
    
    // Risk box
    pdf.setFillColor(254, 243, 199); // Light orange background
    pdf.setDrawColor(colors.warning[0], colors.warning[1], colors.warning[2]);
    pdf.setLineWidth(0.5);
    const riskLines = pdf.splitTextToSize(data.majorRisk, maxWidth - 16);
    const riskHeight = riskLines.length * 6 + 12;
    
    checkNewPage(riskHeight + 8);
    pdf.rect(margin, yPosition, maxWidth, riskHeight, 'FD');
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
    pdf.text(riskLines, margin + 8, yPosition + 10);
    yPosition += riskHeight + 10;

    // Deep Research Content (if available)
    if (selectedModel === 'sonar-deep-research') {
      if (data.marketSize) {
        addSectionHeader('MARKET SIZE ANALYSIS', colors.secondary);
        addText('Market opportunity and sizing:', 9, false, 0, colors.gray);
        addSpacing(5);
        addText(data.marketSize, 10, false, 10);
        addSpacing(8);
      }
      
      if (data.userPersonas && data.userPersonas.length > 0) {
        addSectionHeader('TARGET USER PERSONAS', colors.primary);
        addText('Key customer segments and characteristics:', 9, false, 0, colors.gray);
        addSpacing(5);
        
        data.userPersonas.forEach((persona, index) => {
          addBulletPoint(persona, index + 1, colors.primary);
        });
        addSpacing(8);
      }
      
      if (data.gtmChannels && data.gtmChannels.length > 0) {
        addSectionHeader('GO-TO-MARKET STRATEGY', colors.success);
        addText('Recommended channels and acquisition strategies:', 9, false, 0, colors.gray);
        addSpacing(5);
        
        data.gtmChannels.forEach((channel, index) => {
          addBulletPoint(channel, index + 1, colors.success);
        });
        addSpacing(8);
      }
      
      if (data.nextMilestones && data.nextMilestones.length > 0) {
        addSectionHeader('NEXT MILESTONES', colors.secondary);
        addText('Recommended next steps and key objectives:', 9, false, 0, colors.gray);
        addSpacing(5);
        
        data.nextMilestones.forEach((milestone, index) => {
          addBulletPoint(milestone, index + 1, colors.secondary);
        });
        addSpacing(8);
      }
    }

    // AI Reasoning - Always included
    if (data.reasoning) {
      addSectionHeader('AI ANALYSIS REASONING', colors.secondary);
      addText('Detailed analytical reasoning and methodology:', 9, false, 0, colors.gray);
      addSpacing(5);
      
      // Reasoning box
      pdf.setFillColor(248, 250, 252); // Light blue background
      pdf.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      pdf.setLineWidth(0.5);
      const reasoningLines = pdf.splitTextToSize(data.reasoning, maxWidth - 16);
      const reasoningHeight = reasoningLines.length * 5 + 12;
      
      checkNewPage(reasoningHeight + 8);
      pdf.rect(margin, yPosition, maxWidth, reasoningHeight, 'FD');
      
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(colors.black[0], colors.black[1], colors.black[2]);
      pdf.text(reasoningLines, margin + 8, yPosition + 10);
      yPosition += reasoningHeight + 10;
    }

    // Sources (if available)
    if (data.sources && data.sources.length > 0) {
      addSectionHeader('RESEARCH SOURCES', colors.gray);
      addText('References and data sources used in this analysis:', 9, false, 0, colors.gray);
      addSpacing(5);
      
      data.sources.forEach((source, index) => {
        checkNewPage(10);
        pdf.setFontSize(8);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
        
        const sourceText = `[${index + 1}] ${source}`;
        const sourceLines = pdf.splitTextToSize(sourceText, maxWidth - 8);
        pdf.text(sourceLines, margin + 4, yPosition);
        yPosition += sourceLines.length * 5 + 3;
      });
    }

    // Add footer to the last page
    addFooter();

    // Save the PDF
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    pdf.save(`venture-scout-report-${timestamp}.pdf`);
  };

  const copyToClipboard = () => {
    const content = generateExportContent();
    navigator.clipboard.writeText(content);
  };

  const generateExportContent = () => {
    let content = "STARTUP IDEA VALIDATION REPORT\n";
    content += "Generated by Startup Idea Validator\n";
    content += "=".repeat(50) + "\n\n";
    
    content += "ELEVATOR PITCH:\n";
    data.elevatorPitch?.forEach((point, index) => {
      content += `${index + 1}. ${point}\n`;
    });
    
    content += "\nTOP COMPETITORS:\n";
    data.competitors?.forEach((competitor, index) => {
      content += `${index + 1}. ${competitor}\n`;
    });
    
    content += `\nMAJOR RISK:\n${data.majorRisk}\n`;
    
    if (selectedModel === 'sonar-deep-research') {
      if (data.marketSize) content += `\nMARKET SIZE:\n${data.marketSize}\n`;
      
      if (data.userPersonas) {
        content += "\nUSER PERSONAS:\n";
        data.userPersonas.forEach((persona, index) => {
          content += `${index + 1}. ${persona}\n`;
        });
      }
      
      if (data.gtmChannels) {
        content += "\nGO-TO-MARKET CHANNELS:\n";
        data.gtmChannels.forEach((channel, index) => {
          content += `${index + 1}. ${channel}\n`;
        });
      }
      
      if (data.nextMilestones) {
        content += "\nNEXT MILESTONES:\n";
        data.nextMilestones.forEach((milestone, index) => {
          content += `${index + 1}. ${milestone}\n`;
        });
      }
    }
    
    if (data.reasoning) {
      content += `\nAI REASONING:\n${data.reasoning}\n`;
    }
    
    if (data.sources && data.sources.length > 0) {
      content += "\nSOURCES:\n";
      data.sources.forEach((source, index) => {
        content += `[${index + 1}] ${source}\n`;
      });
    }
    
    return content;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-4 bg-gray-900 text-white rounded-xl">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-semibold mb-1">
              {selectedModel === 'sonar-deep-research' ? '🔍 Deep Research' : selectedModel === 'sonar' ? '🧠 Quick Analysis' : '🤔 Reasoning'}
            </h4>
            <p className="text-gray-300 text-sm">
              {selectedModel === 'sonar-deep-research' 
                ? 'Comprehensive research analysis' 
                : selectedModel === 'sonar'
                ? 'Fast Chain-of-Thought analysis'
                : 'Reasoning analysis'
              }
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              onClick={copyToClipboard}
              variant="outline" 
              size="sm"
              className="text-black border-gray-600 hover:bg-gray-100 bg-white text-xs"
            >
              Copy
            </Button>
            <Button 
              onClick={exportToPDF}
              size="sm"
              className="bg-white text-gray-900 hover:bg-gray-100 text-xs"
            >
              📄 PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-4">
        {/* Elevator Pitch */}
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
            <span className="text-lg mr-2">🚀</span>Elevator Pitch
          </h5>
          <div className="space-y-2">
            {data.elevatorPitch?.map((point, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-800 text-sm leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Competitors */}
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
            <span className="text-lg mr-2">🏢</span>Top Competitors
          </h5>
          <div className="space-y-2">
            {data.competitors?.map((competitor, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <span className="text-gray-800 text-sm leading-relaxed">{competitor}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Major Risk */}
        <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
          <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
            <span className="text-lg mr-2">⚠️</span>Major Risk
          </h5>
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
            <p className="text-gray-800 text-sm leading-relaxed">{data.majorRisk}</p>
          </div>
        </div>

        {/* Deep Research Content */}
        {selectedModel === 'sonar-deep-research' && (
          <>
            {data.marketSize && (
              <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
                  <span className="text-lg mr-2">📊</span>Market Size
                </h5>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-gray-800 text-sm leading-relaxed">{data.marketSize}</p>
                </div>
              </div>
            )}

            {data.userPersonas && (
              <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
                  <span className="text-lg mr-2">👥</span>User Personas
                </h5>
                <div className="space-y-2">
                  {data.userPersonas.map((persona, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 text-sm leading-relaxed">{persona}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.gtmChannels && (
              <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
                  <span className="text-lg mr-2">📢</span>Go-to-Market
                </h5>
                <div className="space-y-2">
                  {data.gtmChannels.map((channel, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 text-sm leading-relaxed">{channel}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data.nextMilestones && (
              <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
                <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
                  <span className="text-lg mr-2">🎯</span>Next Milestones
                </h5>
                <div className="space-y-2">
                  {data.nextMilestones.map((milestone, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <span className="flex-shrink-0 w-6 h-6 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                        {index + 1}
                      </span>
                      <span className="text-gray-800 text-sm leading-relaxed">{milestone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* AI Reasoning - Always visible */}
        {data.reasoning && (
          <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
              <span className="text-lg mr-2">🧠</span>AI Reasoning
            </h5>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <div className="flex items-start space-x-3 mb-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center">
                  <span className="text-sm">🤔</span>
                </div>
                <div className="flex-1">
                  <h6 className="font-medium text-gray-900 mb-2 text-sm">Analysis Process:</h6>
                  <div className="prose prose-sm max-w-none">
                    <p className="text-gray-700 text-xs leading-relaxed whitespace-pre-line">{data.reasoning}</p>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Transparent step-by-step AI analysis process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sources */}
        {data.sources && data.sources.length > 0 && (
          <div className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <h5 className="font-semibold text-base mb-3 text-gray-900 flex items-center">
              <span className="text-lg mr-2">📚</span>Sources
            </h5>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600 mb-3 font-medium">
                Research sources used for this analysis:
              </p>
              <div className="space-y-2">
                {data.sources.map((source, index) => (
                  <div key={index} className="flex items-start space-x-3 p-2 bg-white rounded-lg border border-gray-100">
                    <span className="flex-shrink-0 w-5 h-5 bg-gray-900 text-white rounded-full flex items-center justify-center text-xs font-medium">
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      {(() => {
                        // Extract URL from source string
                        const urlMatch = source.match(/(https?:\/\/[^\s]+)/);
                        const url = urlMatch ? urlMatch[1] : null;
                        
                        if (url) {
                          // Extract the title (everything before the URL)
                          const title = source.replace(/(https?:\/\/[^\s]+)/g, '').replace(/:\s*$/, '').trim();
                          const displayTitle = title || url;
                          
                          return (
                            <a 
                              href={url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-gray-900 hover:text-gray-700 underline font-medium text-xs"
                            >
                              {displayTitle}
                            </a>
                          );
                        } else {
                          return <span className="text-gray-800 font-medium text-xs">{source}</span>;
                        }
                      })()}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  Real-time web research for current information.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
