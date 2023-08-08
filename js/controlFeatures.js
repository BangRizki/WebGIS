var details;
			
function disableModal()
{
    document.getElementById("myModal").style.display = "none";
}

function populateList()
{
    var types = new Set();
    details = new Set();
    
    document.getElementById("list").innerHTML = "";
    
    for(var i = 0; i < features.length; i++)
    {
        var entryName = features[i][3];
        if(features[i][2] === "hidden")
        {
            entryName += " (hidden)";
        }
        
        types.add(features[i][2]);
        
        var entryID = "location" + i.toString();
        
        var listEntry = "<div id='" + entryID + "' class='listEntry' ondblclick='populateLocation(" + i + ");'>" + entryName + "</div>";
        document.getElementById("list").innerHTML += listEntry;
        
        if(features[i].length > 4)
        {
            for(var j = 0; j < features[i][4].length; j++)
            {
                details.add(features[i][4][j][0]);
            }
        }
    }
    
    types.add("hidden");
    
    document.getElementById("locationTypes").innerHTML += "<option>Please select a type</option>";
    types.forEach(function(type) {
        document.getElementById("locationTypes").innerHTML += "<option>" + type + "</option>";
    });
    
    document.getElementById("locationDetails").innerHTML += "<option>Please select a detail</option>";
    details.forEach(function(detail) {
        document.getElementById("locationDetails").innerHTML += "<option>" + detail + "</option>";
        document.getElementById("detailList").innerHTML += "<div id='detail" + detail + "'></div>";
    });
}

function populateDetail()
{
    var dropdown = document.getElementById("locationDetails");
    var index = dropdown.options.selectedIndex;
    var detail = dropdown.options[index].text;

    var detailsList = document.getElementById("detailList");
    
    for(var i = 0; i < detailsList.children.length; i++)
    {
        document.getElementById(detailsList.children[i].id).style.display = "none";
    }
    
    if(index === 0)
    {
        return;
    }
    
    var detailID = "detail" + dropdown.options[index].text;
    
    document.getElementById(detailID).style.display = "block";
}

function deleteRow(detailID, index)
{
    var detailEntry = document.getElementById(detailID).children[0];
    
    for(var i = index; i < detailEntry.children.length - 1; i++)
    {
        var currentEntry = detailEntry.children[i];
        var nextEntry = detailEntry.children[i + 1];
        
        currentEntry.children[0].value = nextEntry.children[0].value;
    }
    
    detailEntry.children[detailEntry.children.length - 2].remove();
}

function addEntryRow(detailID)
{
    var thisDetail = document.getElementById(detailID).children[0];
    
    var newIndex = thisDetail.children.length - 1;
    
    var newRow = document.createElement('div');
    newRow.className = "detailText";
    newRow.innerHTML = (newIndex + 1) + ": <input class='detailTextBox' type='text'/><button class='clearEntry' onclick='deleteRow(\"" + detailID + "\", " + newIndex + ");'>X</button>";

    thisDetail.insertBefore(newRow, thisDetail.children[newIndex]);
}

function populateLocation(index)
{
    disableModal();
    
    var feature = features[index];
    
    document.getElementById("locationIndex").value = index;
    document.getElementById("nameText").value = feature[3];
    document.getElementById("latText").value = feature[0];
    document.getElementById("lngText").value = feature[1];
    
    document.getElementById("locationDetails").options.selectedIndex = 0;
    
    var dropdown = document.getElementById("locationTypes");
    for(var i = 0; i < dropdown.options.length; i++)
    {
        if(dropdown[i].value === feature[2])
        {
            dropdown.options.selectedIndex = i;
            break;
        }
    }
    
    details.forEach(function(detail) {
        var detailID = "detail" + detail;
        document.getElementById(detailID).innerHTML = "";
        document.getElementById(detailID).style.display = "none";
        
        var addRow = "<div class='addEntry'>Add new entry?<button onclick='addEntryRow(\"" + detailID + "\");'>Add Row</button></div>";
        
        var detailText = "<div class='detailEntry'>";
        
        if(feature.length > 4)
        {
            for(var j = 0; j < feature[4].length; j++)
            {
                if(feature[4][j][0] === detail)
                {
                    for(var k = 1; k < feature[4][j].length; k++)
                    {
                        detailText += "<div class='detailText'>" + k.toString() + ": " + "<input class='detailTextBox' type='text' value=\"" + feature[4][j][k] + "\"\><button class='clearEntry' onclick='deleteRow(\"" + detailID + "\", " + (k-1) + ");'>X</button></div>";
                    }
                    break;
                }

            }
        }
        
        detailText += addRow + "</div>";
        document.getElementById(detailID).innerHTML = detailText;
    });
}

function clearLocation()
{
    document.getElementById("nameText").value = "";
    document.getElementById("latText").value = "";
    document.getElementById("lngText").value = "";
    document.getElementById("locationTypes").options.selectedIndex = 0;
    document.getElementById("locationDetails").options.selectedIndex = 0;
    
    details.forEach(function(detail) {
        var detailID = "detail" + detail;
        document.getElementById(detailID).innerHTML = "";
        document.getElementById(detailID).style.display = "none";
    });
}

function addLocation()
{
    disableModal();
    document.getElementById("locationIndex").value = features.length;
    clearLocation();
    
    details.forEach(function(detail) {
        var detailID = "detail" + detail;
        document.getElementById(detailID).innerHTML = "";
        document.getElementById(detailID).style.display = "none";
        
        var addRow = "<div class='addEntry'>Add new entry?<button onclick='addEntryRow(\"" + detailID + "\");'>Add Row</button></div>";
        
        var detailText = "<div class='detailEntry'>" + addRow + "</div>";
        
        document.getElementById(detailID).innerHTML = detailText;
    });

}

function saveLocation()
{
    var entryIndex = document.getElementById("locationIndex").value;
    var entryID = "location" + entryIndex;
    
    var updatedName = document.getElementById("nameText").value;
    var updatedLat = document.getElementById("latText").value;
    var updatedLng = document.getElementById("lngText").value;
    
    if(updatedName.length < 3 || updatedLat.length < 3 || updatedLng.length < 3)
    {
        return;
    }
    
    var updatedTypeBox = document.getElementById("locationTypes");
    
    if(updatedTypeBox.options.selectedIndex === 0)
    {
        return;
    }
    
    var updatedType = updatedTypeBox.options[updatedTypeBox.options.selectedIndex].text;
    
    var updatedEntry = [Number(updatedLat), Number(updatedLng), updatedType, updatedName, []];
    
    details.forEach(function(detail) {
        var detailID = "detail" + detail;
        
        var thisDetail = document.getElementById(detailID);
    
        var entryDetail = [detail];
        
        for(var i = 0; i < thisDetail.children[0].children.length; i++)
        {
            var detailChild = thisDetail.children[0].children[i];
        
            if(detailChild.classList.contains("addEntry"))
            {
                continue;
            }
            
            var detailText = detailChild.children[0].value;
            
            entryDetail.push(detailText);
        }
        
        if(entryDetail.length > 1)
        {
            updatedEntry[4].push(entryDetail);
        }
    });
    
    if(updatedEntry[4].length === 0)
    {
        updatedEntry.pop();
    }
    
    console.log(updatedEntry);
    
    if(!document.contains(document.getElementById(entryID)))
    {
        var listEntry = "<div id='" + entryID + "' class='listEntry' ondblclick='populateLocation(" + document.getElementById("locationIndex").value + ");'>" + updatedName + "</div>";
        document.getElementById("list").innerHTML += listEntry;
        features.push(updatedEntry);
    }
    
    features[parseInt(entryIndex)] = updatedEntry;
    document.getElementById(entryID).innerHTML = updatedName;
}

function download() 
{
    var filename = "features.js";
    
    var text = "var features = [\n";
    for(var i = 0; i < features.length; i++)
    {
        text += "\t" + JSON.stringify(features[i]) + ",\n";
    }
    text += "];";
    
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}