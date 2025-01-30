import React, { useState, useEffect } from "react";
import { WalletSelector } from "@aptos-labs/wallet-adapter-ant-design";
import { Layout, Row, Col, Button, Spin, Input, Card, Modal, message } from "antd";
import { useWallet, InputTransactionData } from "@aptos-labs/wallet-adapter-react";
import { Aptos } from "@aptos-labs/ts-sdk";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Quote, Brain, Plus, RefreshCw, History, ChevronRight, LightbulbIcon } from "lucide-react";
import "@aptos-labs/wallet-adapter-ant-design/dist/index.css";

export const aptos = new Aptos();
const MODULE_ADDRESS = "0x7dbdf51172331c1f93ba9e5bf06c9bcd69b21b6cde2a3e198a167bf980fe81e3";

interface EventData {
  key: string;
  sequence_number: string;
  type: string;
  data: {
    quote: string;
  };
}

function App() {
  const [newQuote, setNewQuote] = useState<string>("");
  const [currentQuote, setCurrentQuote] = useState<string>("");
  const [transactionInProgress, setTransactionInProgress] = useState<boolean>(false);
  const [hasQuoteHolder, setHasQuoteHolder] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [aiQuote, setAiQuote] = useState<string>("");
  const [loadingAI, setLoadingAI] = useState<boolean>(false);
  const { account, signAndSubmitTransaction } = useWallet();

  const fetchQuoteHolder = async () => {
    if (!account) return;
    try {
      const quoteHolderResource = await aptos.getAccountResource({
        accountAddress: account?.address,
        resourceType: `${MODULE_ADDRESS}::RandomQuote::QuoteHolder`
      });
      setHasQuoteHolder(true);
      
      try {
        const response = await fetch(
          `https://fullnode.devnet.aptoslabs.com/v1/accounts/${account.address}/events/${MODULE_ADDRESS}::RandomQuote::QuoteHolder/quote_added_events`
        );
        const events = await response.json() as EventData[];
        if (events.length > 0) {
          setCurrentQuote(events[events.length - 1].data.quote);
        }
      } catch (error) {
        console.error("Error fetching events:", error);
      }
    } catch (e: any) {
      setHasQuoteHolder(false);
    }
  };

  const fetchLatestEvent = async () => {
    if (!account) return;
    try {
      const response = await fetch(
        `https://fullnode.devnet.aptoslabs.com/v1/accounts/${account.address}/events/${MODULE_ADDRESS}::RandomQuote::QuoteHolder/quote_added_events`
      );
      const events = await response.json() as EventData[];
      if (events.length > 0) {
        setCurrentQuote(events[events.length - 1].data.quote);
      }
    } catch (error) {
      console.error("Error fetching latest event:", error);
    }
  };

  const initializeQuoteHolder = async () => {
    if (!account) return;
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::RandomQuote::initialize`,
        functionArguments: []
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({transactionHash: response.hash});
      setHasQuoteHolder(true);
      message.success("Quote holder initialized successfully!");
    } catch (error: any) {
      console.error("Error initializing quote holder:", error);
      message.error("Failed to initialize quote holder");
      setHasQuoteHolder(false);
    } finally {
      setTransactionInProgress(false);
    }
  };

  const addQuote = async () => {
    if (!account || !newQuote) return;
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::RandomQuote::add_quote`,
        functionArguments: [newQuote]
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({transactionHash: response.hash});
      await fetchLatestEvent();
      setNewQuote("");
      message.success("Quote added successfully!");
    } catch (error: any) {
      console.error("Error adding quote:", error);
      message.error("Failed to add quote");
    } finally {
      setTransactionInProgress(false);
    }
  };

  const getRandomQuote = async () => {
    if (!account) return;
    setTransactionInProgress(true);

    const transaction: InputTransactionData = {
      data: {
        function: `${MODULE_ADDRESS}::RandomQuote::get_random_quotee`,
        functionArguments: []
      }
    };

    try {
      const response = await signAndSubmitTransaction(transaction);
      await aptos.waitForTransaction({transactionHash: response.hash});
      await fetchLatestEvent();
      message.success("Random quote fetched successfully!");
    } catch (error: any) {
      console.error("Error getting random quote:", error);
      message.error("Failed to get random quote");
    } finally {
      setTransactionInProgress(false);
    }
  };



  const generateAIQuote = async () => {
    setLoadingAI(true);
    try {
      const response = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR-API-KEY',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: "Generate a short, inspiring quote that would motivate someone to achieve their goals. Keep it under 100 characters and make it meaningful."
              }]
            }]
          })
        }
      );
      
      const data = await response.json();
      
      const generatedQuote = data.candidates[0].content.parts[0].text;
      setAiQuote(generatedQuote);
    } catch (error) {
      console.error('Error generating AI quote:', error);
      message.error("Failed to generate AI quote");
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    fetchQuoteHolder();
  }, [account?.address]);

 
    const QuoteCard = ({ quote }: { quote: string }) => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-8 border-0 hover:shadow-pink-500/10 transition-all duration-300 mt-8">
          <div className="flex items-center mb-6">
            <div className="p-3 bg-pink-600 rounded-xl mr-4">
              <Quote className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Quote of the Moment</h2>
          </div>
          <p className="text-xl italic leading-relaxed text-gray-300 font-serif pl-4 border-l-4 border-pink-500">{quote}</p>
        </Card>
      </motion.div>
    );
  
    return (
      <div className="min-h-screen bg-gray-950">
        <Layout className="bg-transparent">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <Row justify="space-between" align="middle" className="py-8">
              <Col>
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center"
                >
                  <div className="p-4 bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl shadow-lg mr-6">
                    <Sparkles className="w-8 h-8 text-white" />
                  </div>
                  <h1 className="text-4xl font-bold text-white">Quotify</h1>
                </motion.div>
              </Col>
              <Col>
                <div className="bg-gray-900 shadow-lg shadow-pink-500/10 rounded-xl p-2">
                  <WalletSelector />
                </div>
              </Col>
            </Row>
          </div>
        </Layout>
  
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
          <Row gutter={[32, 32]}>
            <Col span={16}>
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="rounded-2xl shadow-lg border-0 bg-gray-900">
                  <h2 className="text-2xl font-bold text-white mb-6">Add New Quote</h2>
                  <div className="space-y-4">
                    <Input
                      onChange={(e) => setNewQuote(e.target.value)}
                      placeholder="Enter your inspiring quote..."
                      size="large"
                      value={newQuote}
                      className="h-12 text-lg rounded-xl bg-gray-800 border-2 border-gray-700 hover:border-pink-500 focus:border-pink-500 text-white"
                    />
                    <div className="flex gap-4">
                      <Button 
                        onClick={addQuote} 
                        type="primary"
                        className="h-12 px-6 bg-pink-600 hover:bg-pink-700 border-0 rounded-xl text-base flex items-center"
                        disabled={!account || !newQuote}
                        icon={<Plus className="w-5 h-5 mr-2" />}
                      >
                        Add Quote
                      </Button>
                      
                      <Button
                        onClick={getRandomQuote}
                        className="h-12 px-6 bg-pink-500 hover:bg-pink-600 text-white border-0 rounded-xl text-base flex-grow flex items-center justify-center"
                        icon={<RefreshCw className="w-5 h-5 mr-2" />}
                      >
                        Get Random Quote
                      </Button>
                      
                      <Button
                        onClick={() => {
                          setIsModalVisible(true);
                          generateAIQuote();
                        }}
                        className="h-12 px-6 bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white border-0 rounded-xl text-base flex items-center"
                        icon={<Brain className="w-5 h-5 mr-2" />}
                      >
                        Generate AI Quote
                      </Button>
                    </div>
                  </div>
                </Card>
  
                <AnimatePresence>
                  {currentQuote && <QuoteCard quote={currentQuote} />}
                </AnimatePresence>
              </motion.div>
            </Col>
            
            <Col span={8}>
              <div className="space-y-6">
                <Card className="rounded-2xl shadow-lg border-0 bg-gray-900">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-gray-800 rounded-xl mr-4">
                      <History className="w-6 h-6 text-pink-500" />
                    </div>
                    <h2 className="text-xl font-bold text-white">Quick Guide</h2>
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Connect your wallet to start managing your personal quote collection",
                      "Initialize the quote holder to create your on-chain storage space",
                      "Use AI generation for instant inspiration or add your favorite quotes"
                    ].map((text, index) => (
                      <li key={index} className="flex items-start bg-gray-800 p-4 rounded-xl">
                        <ChevronRight className="w-5 h-5 text-pink-500 mr-3 mt-1 flex-shrink-0" />
                        <p className="text-gray-300">{text}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
  
                <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-pink-600 to-pink-700 text-white">
                  <div className="flex items-center mb-4">
                    <div className="p-2 bg-white/10 rounded-lg mr-4">
                      <LightbulbIcon className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold">Pro Tip</h2>
                  </div>
                  <p className="text-white/90 leading-relaxed">
                    Try mixing AI-generated quotes with your personal favorites to create a unique collection that reflects your style.
                  </p>
                </Card>
              </div>
            </Col>
          </Row>
        </div>
  
        <Modal
          title={
            <div className="flex items-center">
              <div className="p-3 bg-gray-800 rounded-xl mr-4">
                <Brain className="w-6 h-6 text-pink-500" />
              </div>
              <span className="text-xl font-bold text-white">AI Generated Quote</span>
            </div>
          }
          open={isModalVisible}
          onOk={() => {
            setNewQuote(aiQuote);
            setIsModalVisible(false);
          }}
          onCancel={() => setIsModalVisible(false)}
          okText="Use This Quote"
          confirmLoading={loadingAI}
          className="rounded-2xl"
          width={600}
        >
          <div className="p-6 bg-gray-800 rounded-xl mt-4">
            {loadingAI ? (
              <div className="text-center py-6">
                <Spin size="large" />
                <p className="mt-4 text-gray-300">Crafting your inspiration...</p>
              </div>
            ) : (
              <p className="text-xl italic text-gray-300 leading-relaxed font-serif pl-4 border-l-4 border-pink-500">
                {aiQuote}
              </p>
            )}
          </div>
        </Modal>
      </div>
    );
  }
  
  export default App;
