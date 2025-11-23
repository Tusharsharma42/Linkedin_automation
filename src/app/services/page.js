'use client'; 
import React, { useState } from 'react';
import { Sparkles, User, Calendar, Clock, Send } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addDoc,collection } from 'firebase/firestore';
import { db} from '../../firebase';

function AIContentGenerator () {
  const [activeTab, setActiveTab] = useState('generate');
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [promptResponses, setpromptResponses] = useState([]);
  const [currentGeneration, setCurrentGeneration] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [postContent, setPostContent] = useState('');

  const genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY);
  const formattedPrompt = `Write a blog post about ${topic}. Make it engaging and informative.`;
  
  // LinkedIn details state
  const [linkedinDetails, setLinkedinDetails] = useState({
    profileUrl: '',
    accessToken: '',
    companyPage: '',
    name: '',
    clientsecret: '',
    clientid: ''
  });
  
  // Scheduling state
  const [scheduleData, setScheduleData] = useState({
    date: '',
    time: '',
    timezone: 'UTC',
    postContent: '',
    hashtags: '',
    isScheduled:''
  });
  const handleLinkedinDetailsChange = (field, value) => {
    setLinkedinDetails(prev => ({ ...prev, [field]: value}));
  };
  const linkedinCollectionRef = collection(db, 'linkedinDetails');

  const saveLinkedinDetails = async () => {
  console.log("Trying to save LinkedIn details...");
  if (!linkedinDetails.profileUrl) {
    alert("LinkedIn Profile URL is required.");
    return;
  }

  try {
    // Add the LinkedIn details to Firestore

    await addDoc(linkedinCollectionRef, linkedinDetails);
    console.log("LinkedIn details saved:", linkedinDetails);
    alert("Saved successfully!");
  } catch (error) {
    console.error("Error saving LinkedIn details:", error);
    alert("Failed to save. See console for errors.");
  }
  };


  const handleScheduleChange = (field, value) => {
    setScheduleData(prev => ({ ...prev, postContent }));
    setScheduleData(prev => ({ ...prev, [field]: value }));
  };

  // const scheduleCollectionref = collection(db,'scheluleData');

  // const savescheduleDetails = async () => {
  // console.log("Saving schedule details...", scheduleData);

  // if (!scheduleData.date || !scheduleData.time || !scheduleData.postContent) {
  //   alert('Please fill in all required fields');
  //   return;
  // }

  // setScheduleData((prev) => ({ ...prev, isScheduled: true }));
  // alert(`Post scheduled for ${scheduleData.date} at ${scheduleData.time}`);

  // try {
  //   await addDoc(scheduleCollectionref, scheduleData);
  //   console.log("Schedule details saved:", scheduleData);
  //   alert("Saved successfully!");
  // } catch (error) {
  //   console.error("Error saving schedule details:", error);
  //   alert("Failed to save. See console for errors.");
  // }
  // };

  const handleScheduleSubmit = async () => {
  try {
    const fullDateTime = new Date(`${scheduleData.date}T${scheduleData.time}`);

    await addDoc(collection(db, "scheduledPosts"), {
      content: postContent, // AI-generated content
      linkedInAccessToken: linkedinDetails.accessToken,
      linkedInProfileUrl: linkedinDetails.profileUrl,
      authorName: linkedinDetails.name,
      clientsecret: linkedinDetails.clientsecret,
      clientid: linkedinDetails.clientid,
      companyPage: linkedinDetails.companyPage,
      hashtags: scheduleData.hashtags,
      scheduledTime: fullDateTime.toISOString(),
      posted: false,
    });

    alert("Post scheduled successfully!");
  } catch (err) {
    console.error("Error scheduling post:", err);
    alert("Something went wrong. Check console for details.");
  }
};


  const tabs = [
    { id: 'generate', label: 'Generate Content', icon: Sparkles },
    { id: 'linkedin', label: 'LinkedIn Details', icon: User },
    { id: 'schedule', label: 'Schedule Post', icon: Calendar }
  ];

  const getResponseForGivenPrompt = async () => {
  try {
    setLoading(true);

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(formattedPrompt);

    const text = result.response.text();

    console.log(text);
    setpromptResponses([...promptResponses, text]);
    setPostContent(text); // Set the generated content as post content

    setLoading(false);
  } catch (error) {
    console.log(error);
    console.log("Something Went Wrong");
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3">
            <Sparkles className="text-purple-600" size={48} />
            AI Content Generator
          </h1>
          <p className="text-xl text-gray-700 max-w-2xl mx-auto">
            Create stunning content effortlessly
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex justify-center mb-4">
            {/* <div className="bg-white rounded-xl p-2 shadow-lg border border-gray-200"> */}
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                      activeTab === tab.id
                        ? 'bg-linear-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                    }`}
                  >
                    <Icon size={20} />
                    {tab.label}
                  </button>
                );
              })}
            {/* </div> */}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Generate Content Tab */}
          {activeTab === 'generate' && (
            <div className="flex flex-col lg:flex-row">
              {/* Input Section */}
              <div className="flex-1 p-8 border-r border-gray-200">
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-900 text-lg font-semibold mb-3">
                      Enter Your Topic
                    </label>
                    <input
                      type="text"
                      value={topic}
                      onChange={(e) => setTopic(e.target.value)}
                      placeholder="What is the topic of your post?"
                      className="w-full px-6 py-4 bg-white border-2 border-gray-300 rounded-xl text-lg focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-500/20 transition-all"
                      disabled={isGenerating}
                    />
                  </div>
                  
                  <button
                    onClick={getResponseForGivenPrompt}
                    disabled={isGenerating || !topic.trim()}
                    className="w-full bg-linear-to-r from-purple-500 to-indigo-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent" />
                        <span className="text-sm">Gemini AI Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={24} />
                        Generate with Gemini AI
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Output Section */}
              <div className="flex-1 p-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-gray-900 text-lg font-semibold mb-3 flex items-center gap-2">
                      Generated Text
                      {currentGeneration && (
                        <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                          {currentGeneration.textTokens} tokens
                        </span>
                      )}
                    </h3>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 min-h-[200px] max-h-[300px] overflow-y-auto">
                      {loading ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                          <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mr-3" />
                          Gemini AI generating text...
                        </div>
                      ) : promptResponses.length > 0 ? (
                        promptResponses.map((promptResponse, index) => (
                          <div key={index} >
                            <div className={`response-text ${index === promptResponses.length - 1 ? 'fw-bold' : ''}`}>{promptResponse}</div>
                            {/* the latest response shown in bold letters */}
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 italic">Your Gemini AI generated text will appear here...</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* LinkedIn Details Tab */}
          {activeTab === 'linkedin' && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <User className="mx-auto text-purple-600 mb-4" size={48} />
                  <h2 className="text-2xl font-bold text-gray-900">LinkedIn Integration</h2>
                  <p className="text-gray-600">Connect your LinkedIn profile to schedule posts</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={linkedinDetails.name}
                      onChange={(e) => handleLinkedinDetailsChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinDetails.profileUrl}
                    onChange={(e) => handleLinkedinDetailsChange('profileUrl', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Access Token (Optional)
                  </label>
                  <input
                    type="password"
                    value={linkedinDetails.accessToken}
                    onChange={(e) => handleLinkedinDetailsChange('accessToken', e.target.value)}
                    placeholder="LinkedIn API access token"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Client secret (Optional)
                  </label>
                  <input
                    type="url"
                    value={linkedinDetails.clientsecret}
                    onChange={(e) => handleLinkedinDetailsChange('clientsecret', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Client id (Optional)
                  </label>
                  <input
                    type="url"
                    value={linkedinDetails.clientid}
                    onChange={(e) => handleLinkedinDetailsChange('clientid', e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Person id(Optional)
                  </label>
                  <input
                    type="text"
                    value={linkedinDetails.companyPage}
                    onChange={(e) => handleLinkedinDetailsChange('companyPage', e.target.value)}
                    placeholder="Company page name or URL"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <button
              onClick={saveLinkedinDetails}
              disabled={loading}
              className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all duration-200 transform hover:scale-105"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                   save the deatils
                </div>
              ) : (
                'Save'
              )}
            </button>
              </div>
            </div>
          )}

          {/* Schedule Post Tab */}
          {activeTab === 'schedule' && (
            <div className="p-8">
              <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center mb-8">
                  <Calendar className="mx-auto text-purple-600 mb-4" size={48} />
                  <h2 className="text-2xl font-bold text-gray-900">Schedule Your Post</h2>
                  <p className="text-gray-600">Choose when to publish your content</p>
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Post Content
                  </label>
                  <textarea
                    type ="text"
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Enter your post content or generate content first..."
                    rows={6}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">
                      <Calendar className="inline mr-2" size={16} />
                      Date
                    </label>
                    <input
                      type="date"
                      value={scheduleData.date}
                      onChange={(e) => handleScheduleChange('date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-900 font-semibold mb-2">
                      <Clock className="inline mr-2" size={16} />
                      Time
                    </label>
                    <input
                      type="time"
                      value={scheduleData.time}
                      onChange={(e) => handleScheduleChange('time', e.target.value)}
                      className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Hashtags (Optional)
                  </label>
                  <input
                    type="text"
                    value={scheduleData.hashtags}
                    onChange={(e) => handleScheduleChange('hashtags', e.target.value)}
                    placeholder="#ai #content #linkedin #socialmedia"
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-gray-900 font-semibold mb-2">
                    Timezone
                  </label>
                  <select
                    value={scheduleData.timezone}
                    onChange={(e) => handleScheduleChange('timezone', e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="UTC">UTC</option>
                    <option value="EST">Eastern Time</option>
                    <option value="PST">Pacific Time</option>
                    <option value="IST">India Standard Time</option>
                    <option value="GMT">Greenwich Mean Time</option>
                  </select>
                </div>

                {scheduleData.isScheduled && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 mb-2">✅ Post Scheduled Successfully!</h4>
                    <p className="text-green-700 text-sm">
                      Your post will be published on {scheduleData.date} at {scheduleData.time} ({scheduleData.timezone})
                    </p>
                  </div>
                )}

                <button
                onClick={handleScheduleSubmit}
                disabled={!scheduleData.postContent || !scheduleData.date || !scheduleData.time}
                className="w-full bg-linear-to-r from-green-500 to-emerald-600 text-white py-4 px-8 rounded-xl text-lg font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
                >
                  <Send size={24} />
                  {scheduleData.isScheduled ? 'Reschedule Post' : 'Schedule Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default AIContentGenerator;