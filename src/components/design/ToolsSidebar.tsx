import backgroundIcon from "@/asset/design/background.svg";
import lineIcon from "@/asset/design/tools/line.svg";
import textIcon from "@/asset/design/text.svg";
import circleIcon from "@/asset/design/tools/circle.svg";
import rectangleIcon from "@/asset/design/tools/rectangle.svg";
import squareIcon from "@/asset/design/tools/square.svg";
import triangleIcon from "@/asset/design/tools/triangle.svg";
import uploadIcon from "@/asset/design/tools/upload.svg";

interface ToolsSidebarProps {
  activeMenu: 'background' | 'element' | 'text' | null;
  setActiveMenu: (menu: 'background' | 'element' | 'text' | null) => void;
  onShapeAdd: (shapeType: string) => void;
  onTextAdd: (textType: string) => void;
}

const ToolsSidebar = ({ activeMenu, setActiveMenu, onShapeAdd, onTextAdd }: ToolsSidebarProps) => {
  return (
    <div className="flex">
      {/* Main Sidebar */}
      <div className="flex flex-col min-h-full border-r-[3px] border-gray-950 pr-2">
        <div
          className="flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer hover:bg-gray-100 rounded-lg"
          onClick={() =>
            setActiveMenu(activeMenu === "background" ? null : "background")
          }
        >
          <img
            src={backgroundIcon}
            alt="Background"
            className="w-6 h-6 mb-2"
          />
          <span className="text-[14px]">Background</span>
        </div>
        <div
          className="flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer hover:bg-gray-100 rounded-lg"
          onClick={() =>
            setActiveMenu(activeMenu === "element" ? null : "element")
          }
        >
          <img
            src={lineIcon}
            alt="Line"
            className="w-6 h-6 mb-2"
          />
          <span className="text-[14px]">Element</span>
        </div>
        <div
          className="flex flex-col justify-center items-center w-20 h-20 mb-6 cursor-pointer hover:bg-gray-100 rounded-lg"
          onClick={() =>
            setActiveMenu(activeMenu === "text" ? null : "text")
          }
        >
          <img
            src={textIcon}
            alt="Text"
            className="w-8 h-8 mb-2"
            style={{ filter: "brightness(0)" }}
          />
          <span className="text-[14px]">Text</span>
        </div>
      </div>

      {/* Tools Sidebar */}
      <div className="w-50 px-3">
        {activeMenu === "background" && (
          <div className="bg-white rounded-lg ">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
                <img
                  src={uploadIcon}
                  alt="Upload"
                  className="w-6 h-6 mb-2"
                  style={{ filter: "brightness(0)" }}
                />
                <span className="text-[14px]">Upload</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="w-6 h-6 bg-white border mb-2"></div>
                <span className="text-[14px]">White</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="w-6 h-6 bg-gray-200 mb-2"></div>
                <span className="text-[14px]">Gray</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="w-6 h-6 bg-blue-500 mb-2"></div>
                <span className="text-[14px]">Blue</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="w-6 h-6 bg-green-500 mb-2"></div>
                <span className="text-[14px]">Green</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50">
                <div className="w-6 h-6 bg-red-500 mb-2"></div>
                <span className="text-[14px]">Red</span>
              </div>
            </div>
          </div>
        )}

        {activeMenu === "element" && (
          <div className="bg-white rounded-lg ">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onShapeAdd('rectangle')}>
                <img
                  src={rectangleIcon}
                  alt="Rectangle"
                  className="w-6 h-6 mb-2"
                  style={{ filter: "brightness(0)" }}
                />
                <span className="text-[14px]">Rectangle</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onShapeAdd('square')}>
                <img
                  src={squareIcon}
                  alt="Square"
                  className="w-6 h-6 mb-2"
                  style={{ filter: "brightness(0)" }}
                />
                <span className="text-[14px]">Square</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onShapeAdd('circle')}>
                <img
                  src={circleIcon}
                  alt="Circle"
                  className="w-6 h-6 mb-2"
                  style={{ filter: "brightness(0)" }}
                />
                <span className="text-[14px]">Circle</span>
              </div>
              
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onShapeAdd('triangle')}>
                <img
                  src={triangleIcon}
                  alt="Triangle"
                  className="w-6 h-6 mb-2"
                  style={{ filter: "brightness(0)" }}
                />
                <span className="text-[14px]">Triangle</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onShapeAdd('line')}>
                <img
                  src={lineIcon}
                  alt="Line"
                  className="w-6 h-6 mb-2"
                  style={{ filter: "brightness(0)" }}
                />
                <span className="text-[14px]">Line</span>
              </div>
            </div>
          </div>
        )}

        {activeMenu === "text" && (
          <div className="bg-white rounded-lg ">
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onTextAdd('textbox')}>
                <span className="text-[14px]">Text Box</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50" onClick={() => onTextAdd('heading')}>
                <span className="text-[14px]">Heading</span>
              </div>
              <div className="flex flex-col justify-center items-center w-20 h-20 border rounded-lg cursor-pointer hover:bg-gray-50 col-span-2" onClick={() => onTextAdd('subtitle')}>
                <span className="text-[14px]">Subtitle</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolsSidebar;