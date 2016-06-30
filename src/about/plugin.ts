// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import {
  Application
} from 'phosphide/lib/core/application';

import {
  Widget
} from 'phosphor-widget';


/**
 * The about page extension.
 */
export
const aboutExtension = {
  id: 'jupyter.extensions.about',
  activate: activateAbout
};


function activateAbout(app: Application): void {
  let widget = new Widget();
  let commandId = 'about-jupyterlab:show';
  widget.id = 'about-jupyterlab';
  widget.title.text = 'About';
  widget.title.closable = true;
  widget.node.innerHTML = `
  <div id="fullpage">
      <!-- PAGE ONE -->
      <div class="section">
          <div class="container">
              <div class="row">
                  <div class="column">
                      <img src="images/logo.svg" alt="jupyterlab logo">
                      <p class="header">Welcome to the JupyterLab pre-alpha preview</p>
                      <div class="desc-one">
                          <p>Click on the JupyterLab tab for the initial JupyterLab screen.</p>
                          <p>This demo gives an pre-alpha-level developer preview of the JupyterLab environment. <b>It is not ready for general usage yet.</b> We are developing JupyterLab at <a href="https://github.com/jupyter/jupyterlab">https://github.com/jupyter/jupyterlab</a>. Pull requests are welcome!</p>
                          <p>Here is a brief description of some of the things you'll find in this demo.</p>
                      </div>
                  </div>
              </div>
              <!-- 4 SECTIONS -->
              <div class="row">
                  <div class="one-half column">
                      <p class="desc-two-header">
                          <a href="#main-area">
                              <img style="margin:-12px 20px;" src="images/main-area.svg">
                              <span style="verical-align: middle">Main Area</span>
                          </a>
                      </p>
                      <p class="desc-two">
                          Open the tabs you want</br>Drag and drop them to split your screen your way
                      </p>
                  </div>
                  <div class="one-half column">
                      <p class="desc-two-header">
                          <a href="#command">
                              <img style="margin:-12px 20px;" src="images/command.svg">
                              <span style="verical-align: middle">Command Palette</span>
                          </a>
                      </p>
                      <p class="desc-two">
                          View list of commands and keyboard shortcuts
                      </p>
                  </div>
              </div>

              <div class="row">
                  <div class="one-half column">
                      <p class="desc-two-header">
                          <a href="#file-browser">
                              <img style="margin:-12px 20px;" src="images/file-browser.svg">
                              <span style="verical-align: middle">File Browser</span>
                          </a>
                      </p>
                      <p class="desc-two">
                          Navigate and organize your files
                      </p>
                  </div>
                  <div class="one-half column">
                      <p class="desc-two-header">
                          <a href="#notebook">
                              <img style="margin:-12px 20px;" src="images/notebook.svg">
                              <span style="verical-align: middle">Notebook</span>
                          </a>
                      </p>
                      <p class="desc-two">
                          Dedicate a tab to running a classic notebook
                      </p>
                  </div>
              </div>

              <!-- END OF 4 SECTIONS -->
          </div>
          <a href="#main-area">
            <img class="nav-button" src="images/next-arrow-sprite.svg">
          </a>
      </div>
      <div class="section">
          <p class="header content"><img src="images/main-area.svg" alt="Main Area logo" align="middle">Main Area</p>
          <img class="content-img" src="images/mainareascreen.gif" alt="Main Area Screenshot">
          <p class="content-desc">The main area is divided into panels of tabs. Drag a tab around the area to split the main area in different ways. Drag a tab to the center of a panel to move a tab without splitting the panel (in this case, the whole panel will highlight instead of just a portion).</p>
          <p class="content-desc">Resize panels by dragging their borders (be aware that panels and sidebars also have a minimum width). A file that contains changes to be saved has a circle for a close icon.</p>
          <a href="#command">
            <img class="nav-button" src="images/next-arrow-sprite.svg">
          </a>
      </div>
      <div class="section">
          <p class="header content"><img src="images/command.svg" alt="Command Palette logo" align="middle">Command Palette</p>
          <img class="content-img" src="images/mainareascreen.gif" alt="Command Palette Screenshot">
          <p class="content-desc">Clicking the "Commands" tab, located on the left, will toggle the command palette. Execute a command by clicking, or navigating with your arrow keys and pressing Enter. Filter commands by typing in the text box at the top of the palette. The palette is organized into categories, and you can filter on a single category by clicking on the category header or by typing the header surrounded by colons in the search input (e.g., <code>:file:</code>).</p>
          <div class="content-desc">
              <p>You can try these things out from the command palette:</p>
              <ul>
                  <li>Open a new terminal (requires OS X or Linux)</li>
                  <li>Open a ipython console</li>
                  <li>Open a new file</li>
                  <li>Save a file</li>
                  <li>Open up a help panel on the right</li>
              </ul>
          </div>
          <a href="#file-browser">
            <img class="nav-button" src="images/next-arrow-sprite.svg">
          </a>
      </div>
      <div class="section">
          <p class="header content"><img src="images/file-browser.svg" alt="File Browser logo" align="middle">File Browser</p>
          <img class="content-img" src="images/mainareascreen.gif" alt="File Browser Screenshot">
          <p class="content-desc">Clicking the "Files" tab, located on the left, will toggle the file browser. Navigate into directories by double-clicking, and use the breadcrumbs at the top to navigate out. Create a new file/directory by clicking the plus icon at the top. Click the middle icon to upload files, and click the last icon to reload the file listing. Drag and drop files to move them to subdirectories. Click on a selected file to rename it. Sort the list by clicking on a column header. Open a file by double-clicking it or dragging it into the main area. Opening an image displays the image. Opening a code file opens a code editor. Opening a notebook opens a very preliminary notebook component.</p>
          <a href="#notebook">
            <img class="nav-button" src="images/next-arrow-sprite.svg">
          </a>
      </div>
      <div class="section">
          <p class="header content"><img src="images/notebook.svg" alt="Notebook logo" align="middle">Notebook</p>
          <img class="content-img" src="images/mainareascreen.gif" alt="Notebook Screenshot">
          <p class="content-desc">Opening a notebook will open a minimally-featured notebook. Code execution, Markdown rendering, and basic cell toolbar actions are supported. Future versions will add more features from the existing Jupyter notebook.</p>
      </div>

  </div>

  <script src="http://ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>
  <script type="text/javascript" src="vendors/scrolloverflow.min.js"></script>
  <script type="text/javascript" src="js/jquery.fullPage.min.js"></script>
  <script>
      $(document).ready(function () {
          $('#fullpage').fullpage({
              anchors: ['about', 'main-area', 'command', 'file-browser', 'notebook']
          });
      });
  </script>
  `;

  widget.node.style.overflowY = 'auto';
  app.commands.add([{
    id: commandId,
    handler: () => {
      if (!widget.isAttached) app.shell.addToMainArea(widget);
      app.shell.activateMain(widget.id);
    }
  }]);

  app.palette.add([{
    command: commandId,
    text: 'About JupyterLab',
    category: 'Help'
  }]);

  app.shell.addToMainArea(widget);
}
